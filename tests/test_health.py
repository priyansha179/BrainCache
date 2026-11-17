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
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=test_engine)
    def override_get_db():
        db = TestingSessionLocal()
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
    search = client.get("/api/notes", params={"q": "retrieval"})
    assert len(search.json()) == 1
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
    response = client.patch("/api/tasks/1/status", json={"status": "Finished"})
    assert response.status_code == 422
    assert client.delete("/api/tasks/999").status_code == 404
