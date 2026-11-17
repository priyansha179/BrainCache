# Backend API Reference

Run the API from the `backend` directory with `uvicorn app.main:app --reload`. Interactive documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## General
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API welcome message |
| GET | `/health` | Service health check |

## Notes
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/notes` | Create a note |
| GET | `/api/notes` | List and search notes |
| GET | `/api/notes/{note_id}` | Retrieve one note |
| PATCH | `/api/notes/{note_id}` | Partially update a note |
| DELETE | `/api/notes/{note_id}` | Delete a note |

The notes list supports `q` (case-insensitive title/content search), `limit` (1–100, default 50), and `offset` (default 0).

## Tasks
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | List tasks |
| PATCH | `/api/tasks/{task_id}/status` | Update task status |
| DELETE | `/api/tasks/{task_id}` | Delete a task |

The task list supports `status` (`Pending`, `In Progress`, or `Completed`), `limit` (1–100, default 50), and `offset` (default 0).

## Validation and errors
- Titles must contain non-whitespace text and may be at most 200 characters.
- Unsupported task status values are rejected with HTTP 422.
- Missing notes/tasks return HTTP 404.
- Successful creation returns HTTP 201; successful deletion returns HTTP 204.

Tests use a separate in-memory SQLite database, keeping test data out of the local development database.
