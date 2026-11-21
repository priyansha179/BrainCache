"""Schemas for semantic search, AI tools, and notifications."""
from pydantic import BaseModel, Field


class SemanticSearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    limit: int = Field(default=10, ge=1, le=30)


class NoteIndexResponse(BaseModel):
    indexed: int
    message: str


class SummarizeRequest(BaseModel):
    note_ids: list[int] = Field(min_length=1, max_length=20)


class SummarizeResponse(BaseModel):
    summary: str
    source_note_ids: list[int]


class RecommendationResponse(BaseModel):
    recommendations: list[str]


class PushTokenRequest(BaseModel):
    expo_push_token: str = Field(min_length=10, max_length=255)
    device_name: str | None = Field(default=None, max_length=120)


class NotificationRead(BaseModel):
    id: int
    title: str
    body: str
    is_read: bool
    created_at: str


class MarkReadRequest(BaseModel):
    is_read: bool = True
