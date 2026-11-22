# BrainCache Mobile Frontend

React Native + Expo mobile application for BrainCache.

## Implemented

- Expo Router navigation and authenticated route protection.
- Email/password registration and login using the FastAPI auth endpoints.
- JWT access token persistence with Expo SecureStore.
- Session restoration through `GET /api/auth/me`.
- Notes create, list, search, edit, and delete flows.
- Tasks create, list, edit, delete, and status updates.
- Live dashboard totals and recent notes/tasks.
- Shared API request helper with bearer authentication and readable errors.

## Run locally

From this directory:

```powershell
npm install
npx expo start
```

## Backend URL

Create a local `.env` file in this frontend directory:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

Use the computer's LAN IP address for a physical phone, not `127.0.0.1`. For an Android emulator, use `http://10.0.2.2:8000`. Keep Gemini keys and JWT signing secrets on the backend only.

The backend must have a configured `JWT_SECRET_KEY` before it can issue tokens. Registration requires a valid email and a password of at least 8 characters.

