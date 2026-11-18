"""BrainCache API: authenticated personal data, search, and productivity endpoints."""
from datetime import datetime
from typing import Literal
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
import os
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from . import models, schemas
from .auth import create_access_token, get_current_user, hash_password, verify_password
from .ai import generate_grounded_answer
from .database import get_db

app = FastAPI(
    title="BrainCache API",
    description="Secure personal knowledge and productivity API.",
    version="1.0.0",
)

origins = [item.strip() for item in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173,http://localhost:8081").split(",") if item.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/", tags=["General"])
def root():
    return {"message": "Welcome to BrainCache API", "docs": "/docs"}


@app.get("/health", tags=["General"])
def health_check():
    return {"status": "healthy", "service": "BrainCache API"}


@app.post("/api/auth/register", response_model=schemas.UserRead, status_code=201, tags=["Authentication"])
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    email = str(payload.email).lower()
    if db.query(models.User).filter(func.lower(models.User.email) == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = models.User(email=email, hashed_password=hash_password(payload.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    db.refresh(user)
    return user


@app.post("/api/auth/login", response_model=schemas.TokenRead, tags=["Authentication"])
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(func.lower(models.User.email) == str(payload.email).lower()).first()
    if user is None or not verify_password(payload.password, user.hashed_password) or not user.is_active:
        raise HTTPException(status_code=401, detail="Incorrect email or password.", headers={"WWW-Authenticate": "Bearer"})
    try:
        token = create_access_token(user.id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/auth/me", response_model=schemas.UserRead, tags=["Authentication"])
def read_me(user: models.User = Depends(get_current_user)):
    return user


def owned_or_404(db: Session, model, record_id: int, user_id: int, label: str):
    record = db.query(model).filter(model.id == record_id, model.user_id == user_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail=f"{label} not found.")
    return record


@app.post("/api/notes", response_model=schemas.NoteRead, status_code=201, tags=["Notes"])
def create_note(payload: schemas.NoteCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = models.Note(user_id=user.id, **payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item


@app.get("/api/notes", response_model=list[schemas.NoteRead], tags=["Notes"])
def list_notes(q: str | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    query = db.query(models.Note).filter(models.Note.user_id == user.id)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(models.Note.title.ilike(term), models.Note.content.ilike(term)))
    return query.order_by(models.Note.updated_at.desc()).offset(offset).limit(limit).all()


@app.get("/api/notes/{note_id}", response_model=schemas.NoteRead, tags=["Notes"])
def get_note(note_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return owned_or_404(db, models.Note, note_id, user.id, "Note")


@app.patch("/api/notes/{note_id}", response_model=schemas.NoteRead, tags=["Notes"])
def update_note(note_id: int, payload: schemas.NoteUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = owned_or_404(db, models.Note, note_id, user.id, "Note")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not changes: raise HTTPException(status_code=422, detail="Provide at least one field to update.")
    for key, value in changes.items(): setattr(item, key, value)
    db.commit(); db.refresh(item)
    return item


@app.delete("/api/notes/{note_id}", status_code=204, tags=["Notes"])
def delete_note(note_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = owned_or_404(db, models.Note, note_id, user.id, "Note")
    db.delete(item); db.commit()


@app.post("/api/tasks", response_model=schemas.TaskRead, status_code=201, tags=["Tasks"])
def create_task(payload: schemas.TaskCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = models.Task(user_id=user.id, **payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item


@app.get("/api/tasks", response_model=list[schemas.TaskRead], tags=["Tasks"])
def list_tasks(status_filter: Literal["Pending", "In Progress", "Completed"] | None = Query(None, alias="status"), limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    query = db.query(models.Task).filter(models.Task.user_id == user.id)
    if status_filter: query = query.filter(models.Task.status == status_filter)
    return query.order_by(models.Task.created_at.desc()).offset(offset).limit(limit).all()


@app.patch("/api/tasks/{task_id}", response_model=schemas.TaskRead, tags=["Tasks"])
def update_task(task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = owned_or_404(db, models.Task, task_id, user.id, "Task")
    changes = payload.model_dump(exclude_unset=True)
    changes = {key: value for key, value in changes.items() if value is not None or key == "due_date"}
    if not changes: raise HTTPException(status_code=422, detail="Provide at least one field to update.")
    for key, value in changes.items(): setattr(item, key, value)
    db.commit(); db.refresh(item)
    return item


@app.patch("/api/tasks/{task_id}/status", response_model=schemas.TaskRead, tags=["Tasks"])
def update_task_status(task_id: int, payload: schemas.TaskUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if payload.status is None: raise HTTPException(status_code=422, detail="A status is required.")
    item = owned_or_404(db, models.Task, task_id, user.id, "Task")
    item.status = payload.status
    db.commit(); db.refresh(item)
    return item


@app.delete("/api/tasks/{task_id}", status_code=204, tags=["Tasks"])
def delete_task(task_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = owned_or_404(db, models.Task, task_id, user.id, "Task")
    db.delete(item); db.commit()


@app.post("/api/reminders", response_model=schemas.ReminderRead, status_code=201, tags=["Reminders"])
def create_reminder(payload: schemas.ReminderCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = models.Reminder(user_id=user.id, **payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item


@app.get("/api/reminders", response_model=list[schemas.ReminderRead], tags=["Reminders"])
def list_reminders(completed: bool | None = None, due_before: datetime | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    query = db.query(models.Reminder).filter(models.Reminder.user_id == user.id)
    if completed is not None: query = query.filter(models.Reminder.is_completed == completed)
    if due_before is not None: query = query.filter(models.Reminder.remind_at <= due_before)
    return query.order_by(models.Reminder.remind_at.asc()).offset(offset).limit(limit).all()


@app.get("/api/reminders/{reminder_id}", response_model=schemas.ReminderRead, tags=["Reminders"])
def get_reminder(reminder_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return owned_or_404(db, models.Reminder, reminder_id, user.id, "Reminder")


@app.patch("/api/reminders/{reminder_id}", response_model=schemas.ReminderRead, tags=["Reminders"])
def update_reminder(reminder_id: int, payload: schemas.ReminderUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = owned_or_404(db, models.Reminder, reminder_id, user.id, "Reminder")
    changes = payload.model_dump(exclude_unset=True)
    changes = {key: value for key, value in changes.items() if value is not None}
    if not changes: raise HTTPException(status_code=422, detail="Provide at least one field to update.")
    for key, value in changes.items(): setattr(item, key, value)
    db.commit(); db.refresh(item)
    return item


@app.delete("/api/reminders/{reminder_id}", status_code=204, tags=["Reminders"])
def delete_reminder(reminder_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = owned_or_404(db, models.Reminder, reminder_id, user.id, "Reminder")
    db.delete(item); db.commit()


@app.post("/api/events", response_model=schemas.CalendarEventRead, status_code=201, tags=["Calendar"])
def create_event(payload: schemas.CalendarEventCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = models.CalendarEvent(user_id=user.id, **payload.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item


@app.get("/api/events", response_model=list[schemas.CalendarEventRead], tags=["Calendar"])
def list_events(start_from: datetime | None = None, end_before: datetime | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if start_from and end_before and end_before <= start_from:
        raise HTTPException(status_code=422, detail="end_before must be later than start_from.")
    query = db.query(models.CalendarEvent).filter(models.CalendarEvent.user_id == user.id)
    if start_from: query = query.filter(models.CalendarEvent.start_at >= start_from)
    if end_before: query = query.filter(models.CalendarEvent.start_at < end_before)
    return query.order_by(models.CalendarEvent.start_at.asc()).offset(offset).limit(limit).all()


@app.get("/api/events/{event_id}", response_model=schemas.CalendarEventRead, tags=["Calendar"])
def get_event(event_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return owned_or_404(db, models.CalendarEvent, event_id, user.id, "Calendar event")


@app.patch("/api/events/{event_id}", response_model=schemas.CalendarEventRead, tags=["Calendar"])
def update_event(event_id: int, payload: schemas.CalendarEventUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = owned_or_404(db, models.CalendarEvent, event_id, user.id, "Calendar event")
    changes = payload.model_dump(exclude_unset=True)
    changes = {key: value for key, value in changes.items() if value is not None or key == "location"}
    if not changes: raise HTTPException(status_code=422, detail="Provide at least one field to update.")
    if changes.get("start_at", item.start_at) is None or changes.get("end_at", item.end_at) <= changes.get("start_at", item.start_at):
        raise HTTPException(status_code=422, detail="end_at must be later than start_at.")
    for key, value in changes.items(): setattr(item, key, value)
    db.commit(); db.refresh(item)
    return item


@app.delete("/api/events/{event_id}", status_code=204, tags=["Calendar"])
def delete_event(event_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = owned_or_404(db, models.CalendarEvent, event_id, user.id, "Calendar event")
    db.delete(item); db.commit()


@app.get("/api/search", response_model=list[schemas.SearchResult], tags=["Search"])
def search_personal_data(q: str = Query(min_length=1, max_length=200), limit: int = Query(20, ge=1, le=50), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Rank matching note/task records with a lightweight keyword relevance score."""
    terms = [term.lower() for term in q.split() if term.strip()]
    if not terms: return []
    results = []
    for model, kind, body_field in ((models.Note, "note", "content"), (models.Task, "task", "description")):
        rows = db.query(model).filter(model.user_id == user.id).filter(or_(*[or_(model.title.ilike(f"%{t}%"), getattr(model, body_field).ilike(f"%{t}%")) for t in terms])).limit(100).all()
        for row in rows:
            body = getattr(row, body_field) or ""
            haystack = f"{row.title} {body}".lower()
            score = sum(haystack.count(term) for term in terms)
            results.append({"type": kind, "id": row.id, "title": row.title, "excerpt": body[:280], "score": score})
    results.sort(key=lambda item: item["score"], reverse=True)
    return results[:limit]


@app.get("/api/dashboard/summary", tags=["Dashboard"])
def dashboard_summary(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return {
        "notes": db.query(models.Note).filter_by(user_id=user.id).count(),
        "tasks": {state: db.query(models.Task).filter_by(user_id=user.id, status=state).count() for state in ("Pending", "In Progress", "Completed")},
        "upcoming_reminders": db.query(models.Reminder).filter(models.Reminder.user_id == user.id, models.Reminder.is_completed.is_(False)).count(),
        "calendar_events": db.query(models.CalendarEvent).filter_by(user_id=user.id).count(),
    }


@app.post("/api/ai/ask", response_model=schemas.AskResponse, tags=["AI"])
async def ask_braincache(payload: schemas.AskRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    """Answer a question using only matching notes owned by the signed-in user."""
    terms = [term.lower() for term in payload.question.split() if len(term) > 2]
    if not terms:
        raise HTTPException(status_code=422, detail="Question must contain searchable terms.")
    matches = db.query(models.Note).filter(
        models.Note.user_id == user.id,
        or_(*[or_(models.Note.title.ilike(f"%{term}%"), models.Note.content.ilike(f"%{term}%")) for term in terms]),
    ).order_by(models.Note.updated_at.desc()).limit(8).all()
    if not matches:
        raise HTTPException(status_code=404, detail="No matching personal notes were found. Save relevant notes and try again.")
    context = "\\n\\n".join(f"Note: {item.title}\\n{item.content[:3000]}" for item in matches)
    try:
        answer = await generate_grounded_answer(payload.question, context)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {
        "answer": answer,
        "sources": [{"note_id": item.id, "title": item.title, "excerpt": item.content[:280]} for item in matches],
    }
