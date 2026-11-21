# BrainCache Mobile Frontend

React Native + Expo mobile application for BrainCache.

## Current milestone

The initial frontend foundation includes:

- Expo Router file-based navigation with five primary tabs.
- A shared visual theme and reusable UI primitives.
- A home dashboard and initial Notes, Tasks, Calendar, and AI screens.
- A small API client for the FastAPI backend.

The screens currently use placeholder/empty-state content. Dashboard totals are not connected to account data yet, and create/edit/delete flows, authentication, and AI requests are not implemented in this milestone.

## Run locally

From this directory:

```powershell
npm install
npx expo start
```

Use Expo Go or an appropriate development build to open the app.

## Backend connection

Set `EXPO_PUBLIC_API_URL` in a local frontend `.env` file to the backend's reachable base URL, for example:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

For a physical phone, use the computer's LAN IP address instead of `127.0.0.1`. For an Android emulator, use the host address appropriate to that emulator. Do not put Gemini API keys, JWT signing secrets, or other server secrets in frontend environment variables.

The API helper is in `src/services/api.js`. It accepts a bearer token from the caller; secure token storage and the authentication flow are planned for the next milestone.

## Next frontend milestones

1. Secure token storage and registration/login flows.
2. Connect notes, tasks, reminders, calendar, and dashboard to the authenticated API.
3. Implement create/edit/delete forms and loading/error states.
4. Connect the AI chat to the grounded Gemini-backed API.
5. Register Expo push tokens and implement notification screens.
6. Add automated UI tests and accessibility review.
