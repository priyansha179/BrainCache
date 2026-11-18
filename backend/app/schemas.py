"""Pydantic schemas used to validate API input and output."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = ""

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Title cannot be blank.")
        return value.strip()


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Title cannot be blank.")
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
    def title_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Title cannot be blank.")
        return value.strip()


class TaskStatusUpdate(BaseModel):
    status: Literal["Pending", "In Progress", "Completed"]


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
        if not value.strip():
            raise ValueError("Title cannot be blank.")
        return value.strip()


class ReminderUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    message: str | None = None
    remind_at: datetime | None = None
    is_completed: bool | None = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Title cannot be blank.")
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
        if not value.strip():
            raise ValueError("Title cannot be blank.")
        return value.strip()

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.end_at <= self.start_at:
            raise ValueError("Event end_at must be later than start_at.")
        return self


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    location: str | None = Field(default=None, max_length=300)
    start_at: datetime | None = None
    end_at: datetime | None = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Title cannot be blank.")
        return value.strip() if value is not None else None


class CalendarEventRead(CalendarEventCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
