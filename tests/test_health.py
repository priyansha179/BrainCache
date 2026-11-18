"""API tests using a temporary in-memory SQLite database."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app


@pytest.fixture
def client():
    test_engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    testing_session = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = testing_session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()


def test_health_endpoint_returns_healthy_status(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "BrainCache API"}


def test_note_create_search_update_delete(client):
    response = client.post("/api/notes", json={"title": "  RAG Basics  ", "content": "Retrieval augmented generation"})
    assert response.status_code == 201
    note = response.json()
    assert note["title"] == "RAG Basics"
    assert len(client.get("/api/notes", params={"q": "retrieval"}).json()) == 1
    updated = client.patch(f"/api/notes/{note['id']}", json={"content": "Updated notes"})
    assert updated.status_code == 200
    assert updated.json()["content"] == "Updated notes"
    assert client.delete(f"/api/notes/{note['id']}").status_code == 204
    assert client.get(f"/api/notes/{note['id']}").status_code == 404


def test_note_rejects_blank_title_and_empty_update(client):
    assert client.post("/api/notes", json={"title": "   "}).status_code == 422
    note = client.post("/api/notes", json={"title": "A note"}).json()
    assert client.patch(f"/api/notes/{note['id']}", json={}).status_code == 422


def test_task_create_filter_update_delete(client):
    created = client.post("/api/tasks", json={"title": "Read proposal", "description": "Chapter 1"})
    assert created.status_code == 201
    task_id = created.json()["id"]
    updated = client.patch(f"/api/tasks/{task_id}/status", json={"status": "In Progress"})
    assert updated.status_code == 200
    assert updated.json()["status"] == "In Progress"
    filtered = client.get("/api/tasks", params={"status": "In Progress"})
    assert [task["id"] for task in filtered.json()] == [task_id]
    assert client.delete(f"/api/tasks/{task_id}").status_code == 204
    assert client.get("/api/tasks", params={"status": "In Progress"}).json() == []


def test_task_rejects_invalid_status_and_missing_task(client):
    assert client.patch("/api/tasks/1/status", json={"status": "Finished"}).status_code == 422
    assert client.delete("/api/tasks/999").status_code == 404


def test_reminder_lifecycle_and_completion_filter(client):
    created = client.post("/api/reminders", json={
        "title": "Project meeting", "message": "Prepare update", "remind_at": "2026-12-01T09:00:00"
    })
    assert created.status_code == 201
    reminder_id = created.json()["id"]
    assert created.json()["is_completed"] is False
    updated = client.patch(f"/api/reminders/{reminder_id}", json={"is_completed": True})
    assert updated.status_code == 200 and updated.json()["is_completed"] is True
    assert len(client.get("/api/reminders", params={"completed": True}).json()) == 1
    assert client.delete(f"/api/reminders/{reminder_id}").status_code == 204
    assert client.get(f"/api/reminders/{reminder_id}").status_code == 404


def test_reminder_rejects_blank_title_and_missing_record(client):
    assert client.post("/api/reminders", json={"title": " ", "remind_at": "2026-12-01T09:00:00"}).status_code == 422
    assert client.get("/api/reminders/999").status_code == 404


def test_calendar_event_lifecycle_and_date_filter(client):
    created = client.post("/api/events", json={
        "title": "Supervisor meeting", "description": "Discuss progress",
        "start_at": "2026-12-02T10:00:00", "end_at": "2026-12-02T11:00:00"
    })
    assert created.status_code == 201
    event_id = created.json()["id"]
    listed = client.get("/api/events", params={"start_from": "2026-12-02T00:00:00"})
    assert [event["id"] for event in listed.json()] == [event_id]
    updated = client.patch(f"/api/events/{event_id}", json={"location": "College"})
    assert updated.status_code == 200 and updated.json()["location"] == "College"
    assert client.patch(f"/api/events/{event_id}", json={"end_at": "2026-12-02T09:00:00"}).status_code == 422
    assert client.delete(f"/api/events/{event_id}").status_code == 204
    assert client.get(f"/api/events/{event_id}").status_code == 404


def test_calendar_rejects_invalid_time_range_and_blank_title(client):
    payload = {"title": "Meeting", "start_at": "2026-12-02T11:00:00", "end_at": "2026-12-02T10:00:00"}
    assert client.post("/api/events", json=payload).status_code == 422
    payload["title"] = " "
    assert client.post("/api/events", json=payload).status_code == 422
