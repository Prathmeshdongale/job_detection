"""
Unit tests for FastAPI endpoints and inference utilities.
"""
import sys
import os
import types
import torch
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Minimal stubs so we can import main.py without a real HuggingFace model
# ---------------------------------------------------------------------------

# Stub transformers module
transformers_stub = types.ModuleType("transformers")


class _FakeTokenizer:
    def __call__(self, text, **kwargs):
        # Return a single-token tensor: [CLS, tok, SEP]
        return {"input_ids": torch.tensor([[101, 2054, 102]]),
                "attention_mask": torch.tensor([[1, 1, 1]])}

    def decode(self, token_ids, skip_special_tokens=True):
        return "urgent"

    @classmethod
    def from_pretrained(cls, path):
        return cls()


class _FakeModel:
    def __call__(self, input_ids=None, attention_mask=None, output_attentions=False, **kwargs):
        seq_len = input_ids.shape[1]
        logits = torch.tensor([[0.2, 0.8]])
        # One layer, one head, seq_len x seq_len attention
        attn = torch.ones(1, 1, seq_len, seq_len) / seq_len
        result = MagicMock()
        result.logits = logits
        result.attentions = (attn,)
        return result

    def to(self, device):
        return self

    def eval(self):
        return self

    @classmethod
    def from_pretrained(cls, path):
        return cls()


transformers_stub.AutoTokenizer = _FakeTokenizer
transformers_stub.AutoModelForSequenceClassification = _FakeModel
sys.modules.setdefault("transformers", transformers_stub)

# Now import app (after stubs are in place)
from main import app, state  # noqa: E402
from inference import extract_phrases  # noqa: E402

client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _set_model_ready(ready: bool):
    state["model_ready"] = ready
    if ready:
        state["tokenizer"] = _FakeTokenizer()
        state["model"] = _FakeModel()
        state["device"] = "cpu"
    else:
        state["tokenizer"] = None
        state["model"] = None


# ---------------------------------------------------------------------------
# /health tests
# ---------------------------------------------------------------------------

class TestHealth:
    def test_health_ok_when_model_ready(self):
        _set_model_ready(True)
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert body["model"] == "bert-fraud-v1"
        assert "device" in body

    def test_health_503_when_model_not_ready(self):
        _set_model_ready(False)
        resp = client.get("/health")
        assert resp.status_code == 503


# ---------------------------------------------------------------------------
# /predict tests
# ---------------------------------------------------------------------------

class TestPredict:
    def setup_method(self):
        _set_model_ready(True)

    def test_predict_returns_valid_response(self):
        resp = client.post("/predict", json={"text": "Earn $5000 weekly from home!"})
        assert resp.status_code == 200
        body = resp.json()
        assert 0.0 <= body["scam_probability"] <= 1.0
        assert isinstance(body["suspicious_phrases"], list)

    def test_predict_empty_string_returns_422(self):
        resp = client.post("/predict", json={"text": ""})
        assert resp.status_code == 422

    def test_predict_missing_text_returns_422(self):
        resp = client.post("/predict", json={})
        assert resp.status_code == 422

    def test_predict_503_when_model_not_ready(self):
        _set_model_ready(False)
        resp = client.post("/predict", json={"text": "Some job description"})
        assert resp.status_code == 503


# ---------------------------------------------------------------------------
# extract_phrases unit tests
# ---------------------------------------------------------------------------

class TestExtractPhrases:
    def _make_tokenizer(self, decode_result="urgent hiring"):
        tok = MagicMock()
        tok.decode.return_value = decode_result
        return tok

    def test_returns_phrases_above_threshold(self):
        """High-attention tokens should produce phrases."""
        seq_len = 5
        # CLS=0, tokens 1-3, SEP=4
        input_ids = torch.tensor([[101, 2054, 2003, 3937, 102]])
        # Attention: token index 1 gets very high attention
        attn_row = torch.zeros(seq_len)
        attn_row[1] = 0.9
        attn_row[2] = 0.8
        # Shape: (1, 1, seq_len, seq_len) — one layer, one head
        attn_tensor = attn_row.unsqueeze(0).unsqueeze(0).unsqueeze(0).expand(1, 1, seq_len, seq_len)
        attentions = (attn_tensor,)

        tokenizer = self._make_tokenizer("urgent hiring")
        original_text = "This is urgent hiring now"

        phrases = extract_phrases(input_ids, attentions, tokenizer, original_text)
        assert isinstance(phrases, list)
        # All returned phrases must be substrings of original text
        for p in phrases:
            assert p.lower() in original_text.lower()

    def test_returns_empty_when_no_high_attention(self):
        """No tokens above threshold → empty list."""
        seq_len = 4
        input_ids = torch.tensor([[101, 2054, 3937, 102]])
        # All attention below threshold (0.05)
        attn_tensor = torch.full((1, 1, seq_len, seq_len), 0.01)
        attentions = (attn_tensor,)

        tokenizer = self._make_tokenizer("anything")
        phrases = extract_phrases(input_ids, attentions, tokenizer, "anything goes here")
        assert phrases == []

    def test_deduplicates_phrases(self):
        """Duplicate phrases should appear only once."""
        seq_len = 5
        input_ids = torch.tensor([[101, 2054, 2054, 2054, 102]])
        attn_row = torch.tensor([0.0, 0.9, 0.9, 0.9, 0.0])
        attn_tensor = attn_row.unsqueeze(0).unsqueeze(0).unsqueeze(0).expand(1, 1, seq_len, seq_len)
        attentions = (attn_tensor,)

        tokenizer = self._make_tokenizer("work")
        phrases = extract_phrases(input_ids, attentions, tokenizer, "work from home work")
        # Should not have duplicates
        assert len(phrases) == len(set(p.lower() for p in phrases))
