# BrainCache — AI-Powered Personal Knowledge OS

**Remember Less. Think More.**

BrainCache is a personal knowledge and productivity platform for capturing, organizing, and retrieving notes, tasks, reminders, and calendar events. Its backend provides account security, private user data, search, and an optional local-model RAG question-answering endpoint.

> **Project status:** Active final-year Computer Engineering major project. The backend now includes semantic note search, AI summarization and recommendations, and an Expo push-notification worker; mobile integration and production deployment remain in progress.

## Backend capabilities

- FastAPI REST API with interactive OpenAPI documentation.
- User registration, Argon2 password hashing, JWT login, and current-user endpoint.
- User-scoped notes, tasks, reminders, and calendar events.
- CRUD operations, validation, filtering, and pagination for personal records.
- Keyword-based search plus Ollama vector-embedding semantic search across personal notes.
- Dashboard summary counts.
- Retrieval-grounded AI Q&A, note summarization, and productivity recommendations using an optional local Ollama model.
- Expo device-token registration, in-app notification inbox, and a separate scheduled reminder push worker.
- SQLAlchemy data models, SQLite development database, and Alembic migration setup.
- Automated integration tests using isolated in-memory SQLite.
- GitHub Actions workflow for backend tests and migration checks.

See [Backend setup](backend/README.md), [API reference](docs/backend-api.md), and [database design](docs/database-design.md).

## Technology stack

| Layer | Technology |
|---|---|
| API | Python, FastAPI |
| Validation | Pydantic |
| ORM / database | SQLAlchemy, SQLite (local), PostgreSQL (deployment option) |
| Authentication | JWT, PyJWT |
| Password security | Argon2 via pwdlib |
| Migrations | Alembic |
| AI generation | Ollama (optional local model) |
| HTTP client | HTTPX |
| Tests | Pytest, FastAPI TestClient |
| Mobile direction | React Native + Expo |

## Repository structure

```text
BrainCache/
├── backend/
│   ├── app/                 # API, models, schemas, authentication, AI service
│   ├── migrations/          # Alembic migrations
│   ├── requirements.txt
│   └── README.md
├── docs/                    # API and database documentation
├── frontend/                # Mobile application starting point
├── tests/                   # Backend integration tests
└── .github/workflows/       # CI
```

## Quick start

Follow [backend/README.md](backend/README.md) for Windows PowerShell setup, environment configuration, database migrations, API startup, authentication, and optional Ollama setup.

## Current limitations / next milestones

- Semantic search and AI features require a running local Ollama service and the `nomic-embed-text` embedding model.
- AI Q&A requires a separately installed and running Ollama model.
- Push delivery uses Expo Push Service; the mobile app must request permission and register its Expo token, and the worker must be run as a separate process in deployment.
- PostgreSQL is supported through SQLAlchemy configuration but needs a production database driver and deployment configuration.
- Production deployment still requires HTTPS, secret management, rate limiting, backups, monitoring, and a reviewed privacy policy.

## Development principles

- Keep personal records isolated by authenticated account.
- Prefer local AI processing for private user data.
- Validate inputs and test API behavior before adding features.
- Use migrations for schema changes; do not rely on implicit table creation in production.
