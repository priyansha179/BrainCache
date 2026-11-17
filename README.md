# BrainCache — An AI-Powered Second Brain

**Remember Less. Think More.**

BrainCache is a personal knowledge and productivity platform designed to help people capture, organize, and retrieve their notes, tasks, reminders, and important information from one place. Its planned AI capabilities will make personal information easier to search, understand, and use through natural-language interaction.

> **Project status:** Initial foundation  
> This repository is being developed incrementally as a final-year Computer Engineering major project.

## Project vision

Information is often scattered across notes, task lists, documents, and calendars. BrainCache aims to bring this information together and provide a reliable way to find and act on it. AI-generated answers will be grounded in the user's own saved information through Retrieval-Augmented Generation (RAG).

## Planned features

- **Personal notes:** Create, organize, and retrieve personal knowledge.
- **Task management:** Track tasks, deadlines, status, and priorities.
- **Reminders and calendar:** Keep important activities visible and timely.
- **Semantic search:** Find information by meaning, not only exact keywords.
- **AI-powered Q&A:** Ask natural-language questions about saved information using RAG.
- **Summaries and suggestions:** Generate useful summaries and contextual productivity suggestions.
- **Notifications:** Support timely reminders and daily overviews.

Features will be delivered in stages; not every planned feature is implemented yet.

## Technology direction

| Layer | Planned technology |
|---|---|
| Mobile application | React Native + Expo |
| Backend API | Python + FastAPI |
| Data access | SQLAlchemy |
| Structured database | SQLite during development; PostgreSQL for production |
| Embeddings | Sentence Transformers |
| Vector database | ChromaDB |
| RAG orchestration | LangChain |
| Local LLM | Ollama |
| Optional cloud LLM | Claude API |
| Cache | Redis |
| Version control | Git + GitHub |

The mobile-first direction follows the proposal's detailed architecture. Cloud AI and external integrations will be optional design choices and must be evaluated for privacy, cost, and feasibility.

## Repository structure

```text
BrainCache/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   └── requirements.txt
├── docs/
│   ├── architecture.md
│   ├── database-design.md
│   └── requirements.md
├── frontend/
│   └── README.md
├── tests/
│   └── test_health.py
├── .gitignore
└── README.md
```

## Getting started — backend

Python 3.10 or newer is recommended.

1. Open a terminal in the repository.
2. Create and activate a virtual environment:

   **Windows PowerShell**
   ```powershell
   cd backend
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

   **macOS / Linux**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   python -m pip install -r requirements.txt
   ```

4. Start the API:

   ```bash
   uvicorn app.main:app --reload
   ```

5. Open the interactive API documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs). The health endpoint is available at `/health`.

The SQLite database is created automatically in the backend working directory when the application starts.

## Running tests

From the `backend` directory, with the virtual environment activated:

```bash
python -m pip install pytest
python -m pytest ../tests -q
```

## Development roadmap

1. Establish project requirements, architecture, and data model.
2. Build and test the backend foundation and core CRUD APIs.
3. Develop the mobile application and connect it to the API.
4. Add authentication, reminders, and calendar workflows.
5. Implement embeddings and semantic retrieval.
6. Add RAG-based question answering and AI assistance.
7. Add summaries, prioritization, notifications, and integrations.
8. Complete testing, privacy/security review, and deployment.

## Development principles

- Build and verify core functionality before introducing AI complexity.
- Keep user data private and avoid sending personal content to external services without clear consent.
- Test API behavior and document decisions as the project evolves.
- Keep setup instructions reproducible for every team member.

*BrainCache is an academic project under active development. Architecture and features may evolve as implementation and testing progress.*
