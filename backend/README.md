# BrainCache Backend

FastAPI backend for personal notes, tasks, reminders, calendar events, search, and optional local AI Q&A.

## Requirements

- Python 3.10+
- SQLite (included with Python) or PostgreSQL
- Ollama is optional and only needed for AI Q&A

## Setup (Windows PowerShell)

From the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Set a strong JWT secret in the current PowerShell session before starting the API:

```powershell
$env:JWT_SECRET_KEY = python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Keep the same secret between restarts. For deployment, configure it through the hosting provider's secret/environment settings; never commit a real secret.

Run migrations and start the API:

```powershell
alembic upgrade head
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs.

## Authentication

1. POST `/api/auth/register` with an email and password (minimum 8 characters).
2. POST `/api/auth/login` with the same credentials.
3. Select **Authorize** in Swagger and enter the returned bearer token.
4. Call `/api/auth/me` to inspect the authenticated account.

All personal-data, search, dashboard, and AI endpoints require a bearer token. Each record query is scoped to the authenticated account. Passwords are hashed with Argon2; JWTs expire after the configured number of minutes.

## API groups

- Authentication: register, login, current user.
- Notes: create, list/search, retrieve, update, delete.
- Tasks: create, list/filter, update, delete.
- Reminders: create, list/filter, retrieve, update, delete.
- Calendar: create, list by date range, retrieve, update, delete.
- Search: keyword-ranked personal notes and tasks.
- Dashboard: per-user totals.
- AI: retrieval-grounded question answering through optional Ollama.

## Local AI

Install Ollama separately, then run:

```powershell
ollama pull llama3.2
ollama serve
```

Configure `OLLAMA_BASE_URL` and `OLLAMA_MODEL` if needed. The AI endpoint returns HTTP 503 when the local model service is unavailable. It retrieves the signed-in user's matching notes and supplies them as context; it does not send personal data to a cloud provider.

## Database notes

Alembic migration `0001_user_ownership` adds the account table and nullable ownership fields to existing notes/tasks/reminders/events. Existing legacy rows remain unassigned and are not shown to newly registered users. Review and export any legacy data before manually reassigning it.

SQLite is the default local database. Configure `DATABASE_URL` for PostgreSQL and install a matching driver before deployment. Use a production-grade secret manager and HTTPS in production.

## Tests

From the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python -m pytest tests -q
```

Tests use a temporary in-memory SQLite database and do not modify the development database.
