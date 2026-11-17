"""BrainCache API entry point."""

from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.orm import Session

from . import models, schemas
from .database import Base, engine, get_db

# Create the initial tables for the local development database.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BrainCache API",
    description="Backend API for the BrainCache personal knowledge and productivity platform.",
    version="0.1.0",
)


@app.get("/", tags=["General"])
def root():
    return {"message": "Welcome to BrainCache API", "docs": "/docs"}


@app.get("/health", tags=["General"])
def health_check():
    return {"status": "healthy", "service": "BrainCache API"}


@app.post("/api/notes", response_model=schemas.NoteRead, status_code=status.HTTP_201_CREATED, tags=["Notes"])
def create_note(payload: schemas.NoteCreate, db: Session = Depends(get_db)):
    note = models.Note(title=payload.title.strip(), content=payload.content)
    if not note.title:
        raise HTTPException(status_code=422, detail="Title cannot be blank.")
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@app.get("/api/notes", response_model=list[schemas.NoteRead], tags=["Notes"])
def list_notes(db: Session = Depends(get_db)):
    return db.query(models.Note).order_by(models.Note.updated_at.desc()).all()


@app.get("/api/notes/{note_id}", response_model=schemas.NoteRead, tags=["Notes"])
def get_note(note_id: int, db: Session = Depends(get_db)):
    note = db.get(models.Note, note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found.")
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
    task = models.Task(
        title=payload.title.strip(),
        description=payload.description,
        due_date=payload.due_date,
    )
    if not task.title:
        raise HTTPException(status_code=422, detail="Title cannot be blank.")
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.get("/api/tasks", response_model=list[schemas.TaskRead], tags=["Tasks"])
def list_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).order_by(models.Task.created_at.desc()).all()


@app.patch("/api/tasks/{task_id}/status", response_model=schemas.TaskRead, tags=["Tasks"])
def update_task_status(task_id: int, payload: schemas.TaskStatusUpdate, db: Session = Depends(get_db)):
    task = db.get(models.Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found.")
    task.status = payload.status
    db.commit()
    db.refresh(task)
    return task
