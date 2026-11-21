# BrainCache Backend

FastAPI backend for personal notes, tasks, reminders, calendar events, search, and Gemini-powered AI features.

## Requirements

- Python 3.10+
- SQLite (included with Python) or PostgreSQL
- A Google Gemini API key for AI chat, summaries, recommendations, and semantic embeddings

## Setup (Windows PowerShell)

From the repository root:

```powershell
cd backend
py -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `.env` and set:
- `GEMINI_API_KEY` to your own key from [Google AI Studio](https://aistudio.google.com/apikey).
- `JWT_SECRET_KEY` to a long random value. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.

Keep both values private. Do not paste them into chat, commit them, or upload them to GitHub. The example file contains placeholders only.

### Initialize the database and start the API

**Recommended (one command):**

```powershell
.\\start.ps1
```

The script runs the Alembic database migrations first and starts the development API only if the migrations succeed. Run it from the backend directory with the virtual environment activated.

**Manual alternative:**

```powershell
python -m alembic upgrade head
python -m uvicorn app.main:app --reload
```

Always apply migrations before starting the API against a new database. If you see `sqlite3.OperationalError: no such table: users`, stop Uvicorn, make sure your terminal is in the `backend` directory, and run `python -m alembic upgrade head`. Do not delete the database.

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
- Search: keyword-ranked personal notes and tasks, plus Gemini embedding-based semantic search.
- Dashboard: per-user totals.
- AI: retrieval-grounded question answering, note summaries, and productivity recommendations through Gemini.

## Gemini AI and semantic search

BrainCache uses the Google Gemini Developer API. Configure `GEMINI_API_KEY` in `backend/.env`. The default generation model is `gemini-flash-lite-latest`; embeddings use `gemini-embedding-001`. Both can be changed with `GEMINI_MODEL` and `GEMINI_EMBEDDING_MODEL`.

- `POST /api/ai/ask`: answer a question using matching notes belonging to the signed-in user.
- `POST /api/ai/index`: create or refresh note embeddings.
- `POST /api/search/semantic`: find notes by meaning rather than exact keywords.
- `POST /api/ai/summarize`: summarize selected note IDs.
- `GET /api/ai/recommendations`: generate practical suggestions from your own notes, tasks, and reminders.

Embeddings are stored per note and per account. The API refreshes an embedding when the note title or content changes. AI requests send the relevant personal-note context to Google's Gemini API; review Google's data-use and privacy terms before using sensitive personal information. API availability and usage limits depend on your Google AI Studio project and selected model.

## Push notifications

The mobile app should request notification permission with `expo-notifications`, obtain its Expo push token, and register it with `POST /api/notifications/device-token`. The API provides an in-app inbox at `GET /api/notifications` and allows read-state updates with `PATCH /api/notifications/{id}`.

Run the separate reminder worker from the backend directory:

```powershell
python -m app.notification_worker
```

The worker polls due reminders every 30 seconds, creates an in-app notification, and sends a push through Expo Push Service when a device token is registered. Run one worker instance initially and supervise it as a separate process in deployment. This worker does not require Gemini.

## Database notes

Alembic migrations create the database tables and add account ownership to notes/tasks/reminders/events. Existing legacy rows remain unassigned and are not shown to newly registered users. Review and export any legacy data before manually reassigning it.

SQLite is the default local database. Configure `DATABASE_URL` for PostgreSQL and install a matching driver before deployment. Use a production-grade secret manager and HTTPS in production.

## Tests

From the repository root:

```powershell
python -m pip install -r backend/requirements.txt
python -m pytest tests -q
```

Tests use a temporary in-memory SQLite database and do not call Gemini; live AI requests require a valid API key.
