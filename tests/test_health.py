"""Integration tests for auth, ownership, CRUD, search, and dashboard APIs."""
import os
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-key-never-use-in-production")

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


def register_and_login(client, email="one@example.com"):
    response = client.post("/api/auth/register", json={"email": email, "password": "strong-pass-123"})
    assert response.status_code == 201, response.text
    login = client.post("/api/auth/login", json={"email": email, "password": "strong-pass-123"})
    assert login.status_code == 200, login.text
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_health_and_authentication_required(client):
    assert client.get("/health").json()["status"] == "healthy"
    assert client.get("/api/notes").status_code == 401


def test_registration_login_and_duplicate_email(client):
    headers = register_and_login(client)
    assert client.get("/api/auth/me", headers=headers).json()["email"] == "one@example.com"
    duplicate = client.post("/api/auth/register", json={"email": "ONE@example.com", "password": "strong-pass-123"})
    assert duplicate.status_code == 409
    assert client.post("/api/auth/login", json={"email": "one@example.com", "password": "wrong-pass"}).status_code == 401
    assert client.post("/api/auth/register", json={"email": "bad@example.com", "password": "short"}).status_code == 422


def test_note_crud_search_and_user_isolation(client):
    first = register_and_login(client)
    second = register_and_login(client, "two@example.com")
    created = client.post("/api/notes", headers=first, json={"title": "RAG Basics", "content": "Retrieval augmented generation"})
    assert created.status_code == 201
    note_id = created.json()["id"]
    assert client.get("/api/notes", headers=first, params={"q": "retrieval"}).json()[0]["id"] == note_id
    assert client.get(f"/api/notes/{note_id}", headers=second).status_code == 404
    assert client.get("/api/notes", headers=second).json() == []
    assert client.patch(f"/api/notes/{note_id}", headers=first, json={"content": "Updated"}).status_code == 200
    assert client.delete(f"/api/notes/{note_id}", headers=first).status_code == 204
    assert client.get(f"/api/notes/{note_id}", headers=first).status_code == 404


def test_task_crud_and_status_filter(client):
    headers = register_and_login(client)
    created = client.post("/api/tasks", headers=headers, json={"title": "Read proposal"})
    task_id = created.json()["id"]
    updated = client.patch(f"/api/tasks/{task_id}", headers=headers, json={"status": "In Progress"})
    assert updated.status_code == 200 and updated.json()["status"] == "In Progress"
    assert len(client.get("/api/tasks", headers=headers, params={"status": "In Progress"}).json()) == 1
    assert client.patch(f"/api/tasks/{task_id}", headers=headers, json={"status": "Finished"}).status_code == 422
    assert client.delete(f"/api/tasks/{task_id}", headers=headers).status_code == 204


def test_reminder_crud_and_filter(client):
    headers = register_and_login(client)
    created = client.post("/api/reminders", headers=headers, json={"title": "Meeting", "remind_at": "2026-12-01T09:00:00"})
    reminder_id = created.json()["id"]
    assert created.status_code == 201 and created.json()["is_completed"] is False
    assert client.patch(f"/api/reminders/{reminder_id}", headers=headers, json={"is_completed": True}).json()["is_completed"] is True
    assert len(client.get("/api/reminders", headers=headers, params={"completed": True}).json()) == 1
    assert client.delete(f"/api/reminders/{reminder_id}", headers=headers).status_code == 204


def test_calendar_crud_and_time_validation(client):
    headers = register_and_login(client)
    payload = {"title": "Supervisor meeting", "start_at": "2026-12-02T10:00:00", "end_at": "2026-12-02T11:00:00"}
    created = client.post("/api/events", headers=headers, json=payload)
    assert created.status_code == 201
    event_id = created.json()["id"]
    assert client.get("/api/events", headers=headers, params={"start_from": "2026-12-02T00:00:00"}).status_code == 200
    assert client.patch(f"/api/events/{event_id}", headers=headers, json={"end_at": "2026-12-02T09:00:00"}).status_code == 422
    assert client.delete(f"/api/events/{event_id}", headers=headers).status_code == 204


def test_search_dashboard_and_cross_user_access(client):
    headers = register_and_login(client)
    client.post("/api/notes", headers=headers, json={"title": "Project design", "content": "RAG retrieval notes"})
    client.post("/api/tasks", headers=headers, json={"title": "Review project"})
    results = client.get("/api/search", headers=headers, params={"q": "project"}).json()
    assert len(results) == 2
    summary = client.get("/api/dashboard/summary", headers=headers).json()
    assert summary["notes"] == 1 and summary["tasks"]["Pending"] == 1



def test_ai_retrieval_never_reads_another_users_notes(client):
    first = register_and_login(client, "owner@example.com")
    second = register_and_login(client, "visitor@example.com")
    client.post("/api/notes", headers=first, json={"title": "Private RAG research", "content": "Personal retrieval augmented generation notes"})
    response = client.post("/api/ai/ask", headers=second, json={"question": "What are my RAG notes?"})
    assert response.status_code == 404
