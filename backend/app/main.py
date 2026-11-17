"""BrainCache API entry point."""
from typing import Literal
from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from . import models, schemas
from .database import Base, engine, get_db

Base.metadata.create_all(bind=engine)
app = FastAPI(
    title="BrainCache API",
    description="Backend API for the BrainCache personal knowledge and productivity platform.",
    version="0.2.0",
)

@app.get("/", tags=["General"])
def root():
    return {"message": "Welcome to BrainCache API", "docs": "/docs"}

@app.get("/health", tags=["General"])
def health_check():
    return {"status": "healthy", "service": "BrainCache API"}

@app.post("/api/notes", response_model=schemas.NoteRead, status_code=status.HTTP_201_CREATED, tags=["Notes"])
def create_note(payload: schemas.NoteCreate, db: Session = Depends(get_db)):
    note = models.Note(title=payload.title, content=payload.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@app.get("/api/notes", response_model=list[schemas.NoteRead], tags=["Notes"])
def list_notes(
    q: str | None = Query(default=None, description="Search note titles and content."),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Note)
    if q and q.strip():
        search = f"%{q.strip()}%"
        query = query.filter(or_(models.Note.title.ilike(search), models.Note.content.ilike(search)))
    return query.order_by(models.Note.updated_at.desc()).offset(offset).limit(limit).all()

@app.get("/api/notes/{note_id}", response_model=schemas.NoteRead, tags=["Notes"])
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.get(models.Note, note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")
    return note

@app.patch("/api/notes/{note_id}", response_model=schemas.NoteRead, tags=["Notes"])
def update_note(note_id: int, payload: schemas.NoteUpdate, db: Session = Depends(get_db)):
    note = db.get(models.Note, note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Provide at least one field to update.")
    for field, value in changes.items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return note

@app.delete("/api/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Notes"])
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.get(models.Note, note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")
    db.delete(note)
    db.commit()
    return None

@app.post("/api/tasks", response_model=schemas.TaskRead, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
def create_task(payload: schemas.TaskCreate, db: Session = Depends(get_db)):
    task = models.Task(title=payload.title, description=payload.description, due_date=payload.due_date)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@app.get("/api/tasks", response_model=list[schemas.TaskRead], tags=["Tasks"])
def list_tasks(
    status_filter: Literal["Pending", "In Progress", "Completed"] | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    query = db.query(models.Task)
    if status_filter is not None:
        query = query.filter(models.Task.status == status_filter)
    return query.order_by(models.Task.created_at.desc()).offset(offset).limit(limit).all()

@app.patch("/api/tasks/{task_id}/status", response_model=schemas.TaskRead, tags=["Tasks"])
def update_task_status(task_id: int, payload: schemas.TaskStatusUpdate, db: Session = Depends(get_db)):
    task = db.get(models.Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    task.status = payload.status
    db.commit()
    db.refresh(task)
    return task

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tasks"])
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(models.Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    db.delete(task)
    db.commit()
    return None
