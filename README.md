# BrainCache — An AI-Powered Second Brain

**Remember Less. Think More.**

BrainCache is a personal knowledge and productivity platform designed to help people capture, organize, and retrieve notes, tasks, reminders, and important information from one place. Its planned AI capabilities will make personal information easier to search, understand, and use through natural-language interaction.

> **Project status:** Backend foundation in progress. This is a final-year Computer Engineering major project.

## Implemented backend features

- FastAPI REST API with interactive OpenAPI documentation.
- Notes: create, list, retrieve, search, partially update, and delete.
- Tasks: create, list, filter by status, update status, and delete.\n- Reminders: create, list, filter by completion, retrieve, update, and delete.\n- Calendar events: create, list by date range, retrieve, update, and delete, with schedule validation.
- Request validation for note/task titles and supported task statuses.
- SQLAlchemy models, SQLite development database, and request-scoped sessions.
- Automated API tests using an isolated in-memory SQLite database.
- GitHub Actions workflow to run backend tests on relevant pushes and pull requests.

See [Backend API Reference](docs/backend-api.md) for endpoint details.

## Planned features

- Personal knowledge capture and organization.
- Authentication and per-user data ownership.\n- Automated reminder delivery and notification scheduling.
- Semantic search using embeddings.
- RAG-based natural-language Q&A grounded in saved information.
- Contextual summaries, suggestions, notifications, and daily briefings.

Not all planned features are implemented yet.

## Technology direction

| Layer | Planned technology |
|---|---|
| Mobile application | React Native + Expo |
| Backend API | Python + FastAPI |
| Data access | SQLAlchemy |
| Structured database | SQLite for development; PostgreSQL for production |
| Embeddings | Sentence Transformers |
| Vector database | ChromaDB |
| RAG orchestration | LangChain |
| Local LLM | Ollama |
| Optional cloud LLM | Claude API |
| Cache | Redis |

## Repository structure

```text
BrainCache/
├── backend/app/          # FastAPI application, database, models and schemas
├── backend/requirements.txt
├── docs/                 # Requirements, architecture, database and API docs
├── frontend/             # Mobile application starting point
├── tests/                # Backend API tests
└── .github/workflows/    # Continuous integration
```

## Run the backend locally

Python 3.10 or newer is recommended.

**Windows PowerShell**
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

**macOS / Linux**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) for interactive API documentation. The health endpoint is at [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).

The SQLite database is created automatically at `backend/braincache.db`.

## Run backend tests

From the repository root, after installing backend dependencies:

```bash
python -m pytest tests -q
```

## Development roadmap

1. Finalize requirements, architecture, and data model.
2. Complete and test core backend APIs.
3. Develop the mobile application and connect it to the API.
4. Add authentication, per-user data ownership, and database migrations.\n5. Implement reminder scheduling and notification delivery.
5. Implement embeddings, semantic retrieval, and RAG-based Q&A.
6. Add summaries, prioritization, notifications, and integrations.
7. Complete security, privacy, usability, and deployment testing.

## Development principles

- Build and verify core functionality before introducing AI complexity.
- Protect personal data and obtain clear consent before using external AI services.
- Keep setup instructions reproducible and test API behavior as the project evolves.

*BrainCache is an academic project under active development; architecture and features may evolve as implementation progresses.*
