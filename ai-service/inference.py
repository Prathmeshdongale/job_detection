"""
ML inference and suspicious phrase extraction logic using BERT.
"""
import os
import re
import torch
from typing import List, Tuple

ATTENTION_THRESHOLD = float(os.getenv("ATTENTION_THRESHOLD", "0.05"))

# ── Rule-based fraud signals (used to boost/calibrate the score) ──────────────
FRAUD_PATTERNS = [
    r'\bearn\b.{0,30}\bweekly\b',
    r'\bwork from home\b',
    r'\bno experience (needed|required|necessary)\b',
    r'\bguaranteed (income|salary|earnings)\b',
    r'\buncapped (earnings|commission)\b',
    r'\b(urgent|immediate)\b.{0,20}\bhiring\b',
    r'\bsend (your )?(cv|resume) (to|via) whatsapp\b',
    r'\bpay.{0,20}\bfee\b',
    r'\bregistration fee\b',
    r'\bwork (just|only) \d+ hours\b',
    r'\beasy money\b',
    r'\bget paid (daily|instantly)\b',
    r'\b(₹|rs\.?|inr).{0,10}\d{4,}\b',   # suspiciously high INR amounts
    r'\b\$\d{3,}[\s/]+(hour|hr|day)\b',   # suspiciously high USD/hour
    r'\bmlm\b',
    r'\bnetwork marketing\b',
    r'\brecruit (others|friends|people)\b',
    r'\bpassive income\b',
    r'\bwork at your own (time|pace|schedule)\b',
    r'\bno (interview|qualification|degree) (needed|required)\b',
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in FRAUD_PATTERNS]


def rule_based_score(text: str) -> Tuple[float, List[str]]:
    """
    Compute a heuristic fraud score and extract matched phrases.
    Returns (score 0-1, list of matched phrases).
    """
    matches = []
    for pattern in COMPILED_PATTERNS:
        m = pattern.search(text)
        if m:
            matches.append(m.group(0).strip())

    # Each match adds ~0.18, capped at 0.95
    score = min(0.95, len(matches) * 0.18)
    return score, list(dict.fromkeys(matches))  # deduplicate, preserve order


def extract_phrases(
    input_ids: torch.Tensor,
    attentions: Tuple[torch.Tensor, ...],
    tokenizer,
    original_text: str,
) -> List[str]:
    """Extract suspicious phrases from BERT attention weights."""
    # Base models may return empty attentions tuple
    if not attentions:
        return []

    last_layer_attn = attentions[-1]          # (1, heads, seq_len, seq_len)
    cls_attn = last_layer_attn[0].mean(dim=0)[0]  # (seq_len,)

    token_ids = input_ids[0]
    seq_len = token_ids.size(0)

    high_attn_indices = [
        i for i in range(1, seq_len - 1)
        if cls_attn[i].item() >= ATTENTION_THRESHOLD
    ]
    if not high_attn_indices:
        return []

    # Merge adjacent indices into spans
    spans: List[List[int]] = []
    current_span = [high_attn_indices[0]]
    for idx in high_attn_indices[1:]:
        if idx == current_span[-1] + 1:
            current_span.append(idx)
        else:
            spans.append(current_span)
            current_span = [idx]
    spans.append(current_span)

    phrases = []
    original_lower = original_text.lower()
    for span in spans:
        span_ids = token_ids[span[0]: span[-1] + 1]
        phrase = tokenizer.decode(span_ids, skip_special_tokens=True).strip()
        if phrase and phrase.lower() in original_lower:
            phrases.append(phrase)

    seen = set()
    unique = []
    for p in phrases:
        if p.lower() not in seen:
            seen.add(p.lower())
            unique.append(p)
    return unique


def run_inference(text: str, tokenizer, model, device: str) -> dict:
    """
    Run inference. Combines BERT output with rule-based signals.
    Falls back gracefully if the model has only 1 output label (base model).
    """
    inputs = tokenizer(
        text,
        return_tensors="pt",
        max_length=512,
        truncation=True,
        padding=True,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs, output_attentions=True)

    logits = outputs.logits   # (1, num_labels)
    num_labels = logits.shape[-1]
    probs = torch.softmax(logits, dim=-1)

    if num_labels >= 2:
        # Fine-tuned model: label 1 = fraud
        model_score = probs[0][1].item()
    else:
        # Base model (1 label): use sigmoid of the single logit as a weak signal
        model_score = torch.sigmoid(logits[0][0]).item()

    # Rule-based score and matched phrases
    rule_score, rule_phrases = rule_based_score(text)

    # Blend: if model is fine-tuned (num_labels >= 2) weight it more;
    # otherwise rely mostly on rules
    if num_labels >= 2:
        final_score = 0.6 * model_score + 0.4 * rule_score
    else:
        final_score = 0.25 * model_score + 0.75 * rule_score

    final_score = max(0.0, min(1.0, final_score))

    # Attention-based phrases (may be empty for base model)
    try:
        attn_phrases = extract_phrases(
            input_ids=inputs["input_ids"],
            attentions=outputs.attentions or (),
            tokenizer=tokenizer,
            original_text=text,
        )
    except Exception:
        attn_phrases = []

    # Merge rule phrases + attention phrases, deduplicate
    all_phrases = rule_phrases + [p for p in attn_phrases if p.lower() not in {r.lower() for r in rule_phrases}]

    return {
        "scam_probability": round(final_score, 4),
        "suspicious_phrases": all_phrases,
    }
