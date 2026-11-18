# BrainCache Database Design

## Tables

### users

| Column | Type | Purpose |
|---|---|---|
| id | Integer, primary key | Account identifier |
| email | String(255), unique, indexed | Login email |
| hashed_password | String(255) | Argon2 password hash |
| is_active | Boolean | Account activation flag |
| created_at | DateTime | Account creation timestamp |

### notes

| Column | Type | Purpose |
|---|---|---|
| id | Integer, primary key | Note identifier |
| user_id | Integer, nullable, indexed | Owning account; null only for legacy unassigned records |
| title | String(200) | Note title |
| content | Text | Note body |
| created_at / updated_at | DateTime | Creation and last-update timestamps |

### tasks

| Column | Type | Purpose |
|---|---|---|
| id | Integer, primary key | Task identifier |
| user_id | Integer, nullable, indexed | Owning account |
| title | String(200) | Task title |
| description | Text | Task details |
| status | String(30) | Pending, In Progress, or Completed |
| due_date | DateTime, nullable | Optional deadline |
| created_at | DateTime | Creation timestamp |

### reminders

| Column | Type | Purpose |
|---|---|---|
| id | Integer, primary key | Reminder identifier |
| user_id | Integer, nullable, indexed | Owning account |
| title | String(200) | Reminder title |
| message | Text | Reminder details |
| remind_at | DateTime, indexed | Scheduled time |
| is_completed | Boolean | Completion state |
| created_at | DateTime | Creation timestamp |

### calendar_events

| Column | Type | Purpose |
|---|---|---|
| id | Integer, primary key | Event identifier |
| user_id | Integer, nullable, indexed | Owning account |
| title | String(200) | Event title |
| description | Text | Event details |
| location | String(300), nullable | Event location |
| start_at / end_at | DateTime | Event time range |
| created_at | DateTime | Creation timestamp |

## Ownership and migration

Newly created records receive the authenticated user's ID. API queries filter by that ID; another account cannot retrieve or modify a record by guessing its ID.

Alembic migration `0001_user_ownership` creates the users table and adds nullable `user_id` columns to existing personal-data tables. Existing records are left unassigned rather than being exposed to the first account that registers. Review and manually migrate legacy records if they need to be retained.

## AI retrieval

The current AI endpoint performs keyword-based retrieval from the signed-in user's notes and sends only the selected note context to the configured local Ollama service. Vector embeddings and a dedicated vector store are future enhancements, not current database features.

## Development and production

SQLite is used by default for local development. SQLAlchemy can connect to PostgreSQL through `DATABASE_URL`; install the matching database driver and validate the deployment migration before production use.
