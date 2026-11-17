# BrainCache — Initial Database Design

## Current entities

### Notes

| Field | Type | Purpose |
|---|---|---|
| id | Integer, primary key | Unique note identifier |
| title | String(200) | Note title |
| content | Text | Note body |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### Tasks

| Field | Type | Purpose |
|---|---|---|
| id | Integer, primary key | Unique task identifier |
| title | String(200) | Task title |
| description | Text | Optional task details |
| status | String(30) | Pending, In Progress, or Completed |
| due_date | DateTime, nullable | Optional deadline |
| created_at | DateTime | Creation timestamp |

## Planned entities

The following entities are design candidates and are not implemented yet:

- **User:** account identity and authentication details.
- **Reminder:** reminder time, message, and completion state.
- **CalendarEvent:** event title, start/end time, and optional description.
- **Tag:** reusable labels for organizing notes and tasks.
- **NoteEmbedding:** embedding metadata and relationship to source notes, with vector values managed by the vector database.

## Design notes

- SQLite is used for the initial local development database.
- SQLAlchemy provides the ORM layer so the database can be changed later.
- User ownership and access-control relationships must be designed before enabling multiple accounts.
- Schema changes should be managed with database migrations before the project reaches production.
