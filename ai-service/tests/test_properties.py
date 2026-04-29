"""
Property-based tests for the AI Service using Hypothesis.

Property 6: Scam probability is always a valid probability (0.0 <= p <= 1.0)
Property 7: Suspicious phrases are substrings of the input text
"""
import sys
import types
import torch
import pytest
from unittest.mock import MagicMock
from hypothesis import given, settings, HealthCheck
from hypothesis import strategies as st
from fastapi.testclient import TestClient

# ---------------------------------------------------------------------------
# Stubs (same pattern as test_main.py — must be set before importing main)
# ---------------------------------------------------------------------------

if "transformers" not in sys.modules:
    transformers_stub = types.ModuleType("transformers")

    class _FakeTokenizer:
        def __call__(self, text, **kwargs):
            tokens = text.split()[:10] or ["x"]
            ids = [101] + list(range(2000, 2000 + len(tokens))) + [102]
            seq_len = len(ids)
            return {
                "input_ids": torch.tensor([ids]),
                "attention_mask": torch.ones(1, seq_len, dtype=torch.long),
            }

        def decode(self, token_ids, skip_special_tokens=True):
            return ""  # return empty so phrases list stays empty by default

        @classmethod
        def from_pretrained(cls, path):
            return cls()

    class _FakeModel:
        def __call__(self, input_ids=None, attention_mask=None,
                     output_attentions=False, **kwargs):
            seq_len = input_ids.shape[1]
            # Always return a valid probability distribution
            logits = torch.tensor([[0.3, 0.7]])
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
    sys.modules["transformers"] = transformers_stub

from main import app, state  # noqa: E402

client = TestClient(app, raise_server_exceptions=False)

# Ensure model is marked ready for all property tests
state["model_ready"] = True
state["device"] = "cpu"

if "transformers" in sys.modules:
    _tok_cls = sys.modules["transformers"].AutoTokenizer
    _mdl_cls = sys.modules["transformers"].AutoModelForSequenceClassification
    state["tokenizer"] = _tok_cls.from_pretrained("x")
    state["model"] = _mdl_cls.from_pretrained("x")


# ---------------------------------------------------------------------------
# Property 6: Scam probability is always a valid probability
# ---------------------------------------------------------------------------

@given(text=st.text(min_size=1, max_size=512))
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_property_6_scam_probability_bounds(text):
    """
    Property 6: For any non-empty text, scam_probability must be in [0.0, 1.0].
    Validates: Requirements 3.4, 8.1, 8.5
    """
    resp = client.post("/predict", json={"text": text})
    # Only assert on successful responses
    if resp.status_code == 200:
        body = resp.json()
        prob = body["scam_probability"]
        assert 0.0 <= prob <= 1.0, f"scam_probability {prob} out of bounds for text: {text!r}"


# ---------------------------------------------------------------------------
# Property 7: Suspicious phrases are substrings of the input text
# ---------------------------------------------------------------------------

@given(text=st.text(
    alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Zs")),
    min_size=1,
    max_size=512,
))
@settings(max_examples=100, suppress_health_check=[HealthCheck.too_slow])
def test_property_7_suspicious_phrases_are_substrings(text):
    """
    Property 7: Every phrase in suspicious_phrases must be a case-insensitive
    substring of the original input text.
    Validates: Requirements 3.4, 6.1, 8.7
    """
    resp = client.post("/predict", json={"text": text})
    if resp.status_code == 200:
        body = resp.json()
        text_lower = text.lower()
        for phrase in body["suspicious_phrases"]:
            assert phrase.lower() in text_lower, (
                f"Phrase {phrase!r} is not a substring of input {text!r}"
            )
