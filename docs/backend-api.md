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

The list supports `q` (case-insensitive title/content search), `limit` (1–100, default 50), and `offset` (default 0).

## Tasks
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks` | List tasks |
| PATCH | `/api/tasks/{task_id}/status` | Update task status |
| DELETE | `/api/tasks/{task_id}` | Delete a task |

The list supports `status` (`Pending`, `In Progress`, or `Completed`), `limit`, and `offset`.

## Reminders
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/reminders` | Create a reminder |
| GET | `/api/reminders` | List reminders; optionally filter with `completed=true/false` |
| GET | `/api/reminders/{reminder_id}` | Retrieve one reminder |
| PATCH | `/api/reminders/{reminder_id}` | Update reminder details or completion state |
| DELETE | `/api/reminders/{reminder_id}` | Delete a reminder |

Reminders store a title, optional message, scheduled `remind_at` datetime, and completion flag. Datetimes should be sent as ISO 8601 values.

## Calendar events
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/events` | Create an event |
| GET | `/api/events` | List events, optionally filtered by `start_from` and `end_before` |
| GET | `/api/events/{event_id}` | Retrieve one event |
| PATCH | `/api/events/{event_id}` | Update event details or schedule |
| DELETE | `/api/events/{event_id}` | Delete an event |

Events include title, description, optional location, `start_at`, and `end_at`. The API rejects events whose end is not later than their start.

## Validation and errors
- Titles must contain non-whitespace text and may be at most 200 characters.
- Unsupported task status values and invalid event time ranges return HTTP 422.
- Missing records return HTTP 404.
- Successful creation returns HTTP 201; successful deletion returns HTTP 204.
- List endpoints support bounded pagination where documented.

Tests use an isolated in-memory SQLite database, keeping test data out of the local development database.
