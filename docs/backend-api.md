# BrainCache Backend API Reference

Base URL for local development: `http://127.0.0.1:8000`

Interactive API documentation: `/docs`. All endpoints under personal data, search, dashboard, and AI require a bearer token. Obtain one through the authentication endpoints and use Swagger's **Authorize** control.

## General

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API welcome response |
| GET | `/health` | Health check |

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Verify credentials and issue JWT |
| GET | `/api/auth/me` | Return the signed-in account |

Registration requires a valid email and password of at least eight characters. Access tokens are sent as `Authorization: Bearer <token>`.

## Notes

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/notes` | Create a note |
| GET | `/api/notes` | List/search notes |
| GET | `/api/notes/{note_id}` | Retrieve a note |
| PATCH | `/api/notes/{note_id}` | Partially update a note |
| DELETE | `/api/notes/{note_id}` | Delete a note |

List parameters: `q`, `limit` (1–100, default 50), and `offset`.

## Tasks

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | List tasks |
| PATCH | `/api/tasks/{task_id}` | Update task details or status |
| PATCH | `/api/tasks/{task_id}/status` | Update task status |
| DELETE | `/api/tasks/{task_id}` | Delete a task |

Supported statuses: `Pending`, `In Progress`, and `Completed`. List parameters include `status`, `limit`, and `offset`.

## Reminders

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/reminders` | Create a reminder |
| GET | `/api/reminders` | List/filter reminders |
| GET | `/api/reminders/{reminder_id}` | Retrieve a reminder |
| PATCH | `/api/reminders/{reminder_id}` | Update reminder or completion state |
| DELETE | `/api/reminders/{reminder_id}` | Delete a reminder |

List parameters: `completed`, `due_before`, `limit`, and `offset`.

## Calendar

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/events` | Create an event |
| GET | `/api/events` | List events by date range |
| GET | `/api/events/{event_id}` | Retrieve an event |
| PATCH | `/api/events/{event_id}` | Update an event |
| DELETE | `/api/events/{event_id}` | Delete an event |

List parameters: `start_from`, `end_before`, `limit`, and `offset`. Event end time must be later than start time.

## Search, dashboard, and AI

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/search?q=...` | Keyword search across the current user's notes and tasks |
| GET | `/api/dashboard/summary` | Counts for the current user's records |
| POST | `/api/ai/ask` | Answer a question using matching private notes and Google Gemini |\n| POST | `/api/ai/index` | Index or refresh the signed-in user’s note embeddings |\n| POST | `/api/search/semantic` | Search personal notes by meaning using Gemini embeddings |\n| POST | `/api/ai/summarize` | Summarize selected personal notes |\n| GET | `/api/ai/recommendations` | Generate productivity suggestions from personal records |

AI request example:

```json
{"question": "What did I save about RAG?"}
```

The response includes an answer and the notes used as sources. AI generation and embedding endpoints require `GEMINI_API_KEY` configured in `backend/.env`; provider or quota failures return HTTP 503. If no matching notes are found, the Q&A endpoint returns HTTP 404. Semantic search stores embeddings per user and refreshes them when note content or the configured embedding model changes.

## Error behavior

- 401: missing, invalid, or expired token.
- 404: record not found or does not belong to the current user.
- 409: duplicate account email.
- 422: invalid request data or query parameters.
- 503: Gemini API key, model access, provider availability, or quota problem.

List endpoints use bounded pagination. Personal record queries are scoped to the authenticated account.
