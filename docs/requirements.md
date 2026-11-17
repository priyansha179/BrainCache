# BrainCache — Initial Requirements

## Purpose

BrainCache is intended to provide one place to capture, organize, manage, and retrieve a user's personal knowledge and productivity information. The requirements below describe the initial project direction and will be refined with feedback from the project team and supervisor.

## Functional requirements

### Core information management
- **FR-01:** The system shall allow a user to create and view personal notes.
- **FR-02:** The system shall allow a user to delete a note.
- **FR-03:** The system shall allow a user to create and view tasks.
- **FR-04:** The system shall allow a user to update a task's status.
- **FR-05:** The system shall support due dates for tasks.

### Planned capabilities
- **FR-06:** The system should support reminders and calendar-based activity views.
- **FR-07:** The system should provide semantic search over saved personal information.
- **FR-08:** The system should answer natural-language questions using retrieved personal data as context.
- **FR-09:** The system should provide summaries and contextual task suggestions.
- **FR-10:** The system should notify users about relevant reminders and daily activities.

## Non-functional requirements

- **Privacy:** Personal information must be protected. External AI services must not receive personal content without an explicit, informed design decision and user consent.
- **Security:** Authentication, authorization, input validation, and secure secret management are required before multi-user or production deployment.
- **Usability:** Common note and task workflows should be simple and accessible on the intended mobile platform.
- **Reliability:** Core data operations should handle invalid input and missing records predictably.
- **Maintainability:** Backend modules, API schemas, tests, and documentation should remain organized and understandable.
- **Performance:** Search and API response performance should be measured as the data volume grows.

## Current implementation boundary

The first backend foundation includes a health endpoint, note create/list/read/delete endpoints, task create/list endpoints, and task status updates. Authentication, reminders, calendar integration, semantic search, RAG, and notifications are planned work, not completed features.
