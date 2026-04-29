"""
FastAPI AI Service — Job Fraud Detection
Starts immediately; loads BERT model in background thread.
Falls back to rule-based detection if model is unavailable.
"""
import os
import threading
from contextlib import asynccontextmanager

import torch
from dotenv import load_dotenv
from fastapi import FastAPI

from inference import run_inference, rule_based_score
from models import HealthResponse, PredictRequest, PredictResponse

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "distilbert-base-uncased")

state: dict = {
    "tokenizer": None,
    "model": None,
    "device": "cpu",
    "model_ready": False,
    "model_loading": False,
    "model_error": None,
}


def _load_model():
    """Load model in a background thread — never blocks startup."""
    state["model_loading"] = True
    try:
        # Import here so startup is instant even if transformers is slow
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        device = "cuda" if torch.cuda.is_available() else "cpu"
        state["device"] = device

        print(f"[INFO] Loading model from '{MODEL_PATH}' on {device}…")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
        model.to(device)
        model.eval()

        state["tokenizer"] = tokenizer
        state["model"] = model
        state["model_ready"] = True
        state["model_error"] = None
        print("[INFO] Model loaded successfully.")
    except Exception as exc:
        state["model_error"] = str(exc)
        state["model_ready"] = False
        print(f"[ERROR] Model load failed: {exc}")
    finally:
        state["model_loading"] = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start model loading in background — uvicorn is ready immediately
    t = threading.Thread(target=_load_model, daemon=True)
    t.start()
    yield
    state["model_ready"] = False


app = FastAPI(title="JobGuard AI Service", lifespan=lifespan)


@app.get("/health", response_model=HealthResponse)
def health():
    if state["model_loading"]:
        return HealthResponse(status="loading", model=MODEL_PATH, device=state["device"])
    if state["model_ready"]:
        return HealthResponse(status="ok", model="bert-fraud-v1", device=state["device"])
    return HealthResponse(
        status="rule-based" if not state["model_error"] else f"error: {state['model_error']}",
        model=MODEL_PATH,
        device=state["device"],
    )


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    text = request.text

    if state["model_ready"] and state["tokenizer"] and state["model"]:
        # Full BERT inference
        result = run_inference(
            text=text,
            tokenizer=state["tokenizer"],
            model=state["model"],
            device=state["device"],
        )
    else:
        # Rule-based fallback — works instantly, no model needed
        score, phrases = rule_based_score(text)
        result = {
            "scam_probability": round(score, 4),
            "suspicious_phrases": phrases,
        }

    return PredictResponse(
        scam_probability=result["scam_probability"],
        suspicious_phrases=result["suspicious_phrases"],
    )
