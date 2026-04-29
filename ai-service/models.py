"""
Pydantic models for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import List


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)


class PredictResponse(BaseModel):
    scam_probability: float = Field(..., ge=0.0, le=1.0)
    suspicious_phrases: List[str]


class HealthResponse(BaseModel):
    status: str
    model: str
    device: str
