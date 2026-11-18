"""Validated request and response schemas."""
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = ""
    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        if not value.strip(): raise ValueError("Title cannot be blank.")
        return value.strip()


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = None
    @field_validator("title")
    @classmethod
    def clean_title(cls, value):
        if value is not None and not value.strip(): raise ValueError("Title cannot be blank.")
        return value.strip() if value is not None else None


class NoteRead(NoteCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    due_date: datetime | None = None
    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        if not value.strip(): raise ValueError("Title cannot be blank.")
        return value.strip()


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    due_date: datetime | None = None
    status: Literal["Pending", "In Progress", "Completed"] | None = None
    @field_validator("title")
    @classmethod
    def clean_title(cls, value):
        if value is not None and not value.strip(): raise ValueError("Title cannot be blank.")
        return value.strip() if value is not None else None


class TaskRead(TaskCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    created_at: datetime


class ReminderCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    message: str = ""
    remind_at: datetime
    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        if not value.strip(): raise ValueError("Title cannot be blank.")
        return value.strip()


class ReminderUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    message: str | None = None
    remind_at: datetime | None = None
    is_completed: bool | None = None
    @field_validator("title")
    @classmethod
    def clean_title(cls, value):
        if value is not None and not value.strip(): raise ValueError("Title cannot be blank.")
        return value.strip() if value is not None else None


class ReminderRead(ReminderCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_completed: bool
    created_at: datetime


class CalendarEventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    location: str | None = Field(default=None, max_length=300)
    start_at: datetime
    end_at: datetime
    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        if not value.strip(): raise ValueError("Title cannot be blank.")
        return value.strip()
    @model_validator(mode="after")
    def valid_range(self):
        if self.end_at <= self.start_at: raise ValueError("end_at must be later than start_at.")
        return self


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    location: str | None = Field(default=None, max_length=300)
    start_at: datetime | None = None
    end_at: datetime | None = None
    @field_validator("title")
    @classmethod
    def clean_title(cls, value):
        if value is not None and not value.strip(): raise ValueError("Title cannot be blank.")
        return value.strip() if value is not None else None


class CalendarEventRead(CalendarEventCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


class SearchResult(BaseModel):
    type: Literal["note", "task"]
    id: int
    title: str
    excerpt: str
    score: int

class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=1000)


class SourceRead(BaseModel):
    note_id: int
    title: str
    excerpt: str


class AskResponse(BaseModel):
    answer: str
    sources: list[SourceRead]
