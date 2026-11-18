# BrainCache — Database Design

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

### Reminders
| Field | Type | Purpose |
|---|---|---|
| id | Integer, primary key | Unique reminder identifier |
| title | String(200) | Reminder title |
| message | Text | Optional reminder details |
| remind_at | DateTime, indexed | Scheduled reminder time |
| is_completed | Boolean | Completion state |
| created_at | DateTime | Creation timestamp |

### Calendar events
| Field | Type | Purpose |
|---|---|---|
| id | Integer, primary key | Unique event identifier |
| title | String(200) | Event title |
| description | Text | Optional event details |
| location | String(300), nullable | Event location |
| start_at | DateTime, indexed | Event start |
| end_at | DateTime | Event end |
| created_at | DateTime | Creation timestamp |

## Planned entities and infrastructure
- **User:** account identity and authentication details.
- **Tag:** reusable labels for organizing notes and tasks.
- **NoteEmbedding:** embedding metadata and relationship to source notes, with vector values managed by the vector database.

## Design notes
- SQLite is used for local development; `DATABASE_URL` can point SQLAlchemy to PostgreSQL.
- SQLAlchemy provides the ORM layer so the database can be changed later.
- User ownership and access-control relationships must be designed before enabling multiple accounts.
- `Base.metadata.create_all` creates new tables but does not migrate existing tables. Introduce Alembic migrations before production schema changes.
