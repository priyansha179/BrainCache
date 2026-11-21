"""Advanced AI, semantic search, and notification API routes."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from . import models
from .auth import get_current_user
from .database import get_db
from .advanced_schemas import (
    SemanticSearchRequest, NoteIndexResponse, SummarizeRequest,
    SummarizeResponse, RecommendationResponse, PushTokenRequest,
    NotificationRead, MarkReadRequest,
)
from .advanced_ai import embed_texts, text_hash, cosine_similarity, summarize_notes, make_recommendations

router = APIRouter(prefix="/api", tags=["Advanced AI and Notifications"])


async def _ensure_note_embeddings(db: Session, user_id: int, notes: list[models.Note]) -> dict[int, list[float]]:
    existing = {row.note_id: row for row in db.query(models.NoteEmbedding).filter_by(user_id=user_id).all()}
    missing = []
    for note in notes:
        content = f"{note.title}\n{note.content}"
        digest = text_hash(content)
        row = existing.get(note.id)
        if row is None or row.content_hash != digest:
            missing.append((note, content, digest))
    if missing:
        vectors = await embed_texts([item[1] for item in missing])
        for (note, _, digest), vector in zip(missing, vectors):
            row = existing.get(note.id)
            if row is None:
                row = models.NoteEmbedding(note_id=note.id, user_id=user_id, vector_data=vector, content_hash=digest)
                db.add(row)
            else:
                row.vector_data = vector
                row.content_hash = digest
                row.updated_at = datetime.now(timezone.utc)
        db.commit()
        existing = {row.note_id: row for row in db.query(models.NoteEmbedding).filter_by(user_id=user_id).all()}
    return {note_id: row.vector_data for note_id, row in existing.items()}


@router.post("/search/semantic", tags=["Search"])
async def semantic_search(payload: SemanticSearchRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    notes = db.query(models.Note).filter_by(user_id=user.id).all()
    if not notes:
        return []
    vectors = await _ensure_note_embeddings(db, user.id, notes)
    query_vector = (await embed_texts([payload.query]))[0]
    ranked = []
    for note in notes:
        vector = vectors.get(note.id)
        if vector:
            score = cosine_similarity(query_vector, vector)
            ranked.append({"type": "note", "id": note.id, "title": note.title, "excerpt": note.content[:280], "score": round(score, 5)})
    ranked.sort(key=lambda item: item["score"], reverse=True)
    return ranked[:payload.limit]


@router.post("/ai/index", response_model=NoteIndexResponse, tags=["AI"])
async def index_notes(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    notes = db.query(models.Note).filter_by(user_id=user.id).all()
    if not notes:
        return {"indexed": 0, "message": "There are no notes to index yet."}
    await _ensure_note_embeddings(db, user.id, notes)
    return {"indexed": len(notes), "message": "Your notes are indexed for semantic search."}


@router.post("/ai/summarize", response_model=SummarizeResponse, tags=["AI"])
async def summarize_personal_notes(payload: SummarizeRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    notes = db.query(models.Note).filter(models.Note.user_id == user.id, models.Note.id.in_(payload.note_ids)).all()
    if len(notes) != len(set(payload.note_ids)):
        raise HTTPException(status_code=404, detail="One or more notes were not found in your account.")
    try:
        summary = await summarize_notes([{"title": note.title, "content": note.content} for note in notes])
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    return {"summary": summary, "source_note_ids": [note.id for note in notes]}


@router.get("/ai/recommendations", response_model=RecommendationResponse, tags=["AI"])
async def productivity_recommendations(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    tasks = db.query(models.Task).filter_by(user_id=user.id).order_by(models.Task.due_date.asc()).limit(30).all()
    reminders = db.query(models.Reminder).filter_by(user_id=user.id, is_completed=False).order_by(models.Reminder.remind_at.asc()).limit(20).all()
    notes = db.query(models.Note).filter_by(user_id=user.id).order_by(models.Note.updated_at.desc()).limit(10).all()
    if not tasks and not reminders and not notes:
        return {"recommendations": ["Add a note, task, or reminder to receive personalized suggestions."]}
    context = "\n".join(
        [f"Task: {t.title}; status={t.status}; due={t.due_date}" for t in tasks]
        + [f"Reminder: {r.title}; scheduled={r.remind_at}" for r in reminders]
        + [f"Note: {n.title}; content={n.content[:500]}" for n in notes]
    )
    try:
        result = await make_recommendations(context)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    lines = [line.strip(" -*•\t") for line in result.splitlines() if line.strip()]
    return {"recommendations": lines[:7] or [result]}


@router.post("/notifications/device-token", tags=["Notifications"])
def register_device_token(payload: PushTokenRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if not (payload.expo_push_token.startswith("ExponentPushToken[") or payload.expo_push_token.startswith("ExpoPushToken[")):
        raise HTTPException(status_code=422, detail="Provide a valid Expo push token.")
    existing = db.query(models.DevicePushToken).filter_by(expo_push_token=payload.expo_push_token).first()
    if existing and existing.user_id != user.id:
        raise HTTPException(status_code=409, detail="This device token is already registered to another account.")
    if existing is None:
        existing = models.DevicePushToken(user_id=user.id, expo_push_token=payload.expo_push_token, device_name=payload.device_name)
        db.add(existing)
    else:
        existing.device_name = payload.device_name
    db.commit()
    return {"message": "Push token registered."}


@router.delete("/notifications/device-token", tags=["Notifications"])
def unregister_device_token(expo_push_token: str = Query(min_length=10), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    row = db.query(models.DevicePushToken).filter_by(user_id=user.id, expo_push_token=expo_push_token).first()
    if row:
        db.delete(row)
        db.commit()
    return {"message": "Device token unregistered."}


@router.get("/notifications", response_model=list[NotificationRead], tags=["Notifications"])
def list_notifications(limit: int = Query(30, ge=1, le=100), unread_only: bool = False, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = db.query(models.UserNotification).filter_by(user_id=user.id)
    if unread_only:
        rows = rows.filter_by(is_read=False)
    return [{"id": row.id, "title": row.title, "body": row.body, "is_read": row.is_read, "created_at": row.created_at.isoformat()} for row in rows.order_by(models.UserNotification.created_at.desc()).limit(limit).all()]


@router.patch("/notifications/{notification_id}", tags=["Notifications"])
def mark_notification_read(notification_id: int, payload: MarkReadRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    row = db.query(models.UserNotification).filter_by(id=notification_id, user_id=user.id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Notification not found.")
    row.is_read = payload.is_read
    db.commit()
    return {"id": row.id, "is_read": row.is_read}
