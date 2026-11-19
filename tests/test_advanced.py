import os
os.environ.setdefault("JWT_SECRET_KEY", "test-only-secret-key-never-use-in-production")
"""Integration tests for advanced AI and notification routes."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app import advanced

@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    def override_db():
        db = factory()
        try: yield db
        finally: db.close()
    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()

def auth(client, email):
    assert client.post("/api/auth/register", json={"email": email, "password": "strong-pass-123"}).status_code == 201
    token = client.post("/api/auth/login", json={"email": email, "password": "strong-pass-123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_semantic_search_and_private_note_summarization(client, monkeypatch):
    owner = auth(client, "owner@example.com")
    other = auth(client, "other@example.com")
    client.post("/api/notes", headers=owner, json={"title": "Mountain trip", "content": "Trekking in the Himalayas"})
    client.post("/api/notes", headers=other, json={"title": "Private finance", "content": "Bank details"})
    async def fake_embeddings(texts):
        return [[1.0, 0.0] if "Himalayas" in v or "Mountain" in v else [0.0, 1.0] for v in texts]
    monkeypatch.setattr(advanced, "embed_texts", fake_embeddings)
    result = client.post("/api/search/semantic", headers=owner, json={"query": "trekking"})
    assert result.status_code == 200 and result.json()[0]["title"] == "Mountain trip"
    owner_note = client.get("/api/notes", headers=owner).json()[0]
    other_note = client.get("/api/notes", headers=other).json()[0]
    async def fake_summary(notes):
        assert all(n["title"] != "Private finance" for n in notes)
        return "Project summary"
    monkeypatch.setattr(advanced, "summarize_notes", fake_summary)
    assert client.post("/api/ai/summarize", headers=owner, json={"note_ids": [owner_note["id"]]}).status_code == 200
    assert client.post("/api/ai/summarize", headers=owner, json={"note_ids": [other_note["id"]]}).status_code == 404

def test_recommendations_and_push_token_registration(client, monkeypatch):
    headers = auth(client, "notify@example.com")
    client.post("/api/tasks", headers=headers, json={"title": "Finish report"})
    async def fake_recommendations(context):
        assert "Finish report" in context
        return "- Review report\n- Plan milestone"
    monkeypatch.setattr(advanced, "make_recommendations", fake_recommendations)
    response = client.get("/api/ai/recommendations", headers=headers)
    assert response.status_code == 200 and len(response.json()["recommendations"]) == 2
    token = "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
    assert client.post("/api/notifications/device-token", headers=headers, json={"expo_push_token": token}).status_code == 200
    assert client.delete("/api/notifications/device-token", headers=headers, params={"expo_push_token": token}).status_code == 200

def test_notifications_require_authentication(client):
    assert client.get("/api/notifications").status_code == 401
