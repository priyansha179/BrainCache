# BrainCache — System Architecture

## Architecture direction

BrainCache follows a mobile-first, three-layer architecture.

1. **Presentation layer:** React Native with Expo. It will provide screens for notes, tasks, reminders, calendar activities, search, and AI chat.
2. **Application layer:** Python with FastAPI. It will expose REST endpoints, validate requests, apply application rules, and coordinate AI retrieval workflows.
3. **Data layer:** SQLAlchemy with SQLite during development and PostgreSQL as a production target. ChromaDB is planned for vector retrieval; Redis is a possible cache.

## Planned AI retrieval flow

1. The user asks a question in natural language.
2. The application converts the query into an embedding.
3. The retrieval layer searches relevant personal information in the vector store.
4. Relevant retrieved passages are added to the model prompt as context.
5. The language model generates an answer grounded in the retrieved context.
6. The application returns the answer and, where practical, references to the retrieved items.

RAG can improve relevance and grounding, but it does not guarantee that a model will never produce an incorrect answer. The application should handle insufficient context and make source information visible.

## AI deployment direction

The proposal considers Ollama for local model inference and an optional Claude API integration. Local inference is the privacy-oriented default to evaluate. A cloud provider should only be used after assessing data handling, cost, connectivity, and user consent.

## Current implementation

The initial backend is a single FastAPI application with SQLAlchemy models for notes and tasks. The API currently uses a local SQLite database. This is a foundation, not the final production architecture.

## Architecture decisions to validate

- Confirm mobile-only versus any web/desktop target.
- Evaluate device and server hardware requirements for local LLM inference.
- Select the calendar integration approach.
- Define authentication and account ownership before supporting multiple users.
- Define backup, export, deletion, and retention behavior for personal data.
