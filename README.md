# Job Tracking App

A full-stack job application tracker for saving roles, tracking progress, and managing follow-ups through a simple kanban-style dashboard.

## Features

- Google sign-in with Firebase Authentication
- Per-user application records stored in PostgreSQL
- Dashboard stats for total, active, and interviewing applications
- Kanban board grouped by application status
- Add applications with company, role, location, salary, notes, dates, and job URL
- Update application status through the API

## Tech Stack

**Client**

- React
- TypeScript
- Vite
- Firebase client SDK
- oxlint

**Server**

- Node.js
- Express
- PostgreSQL
- Firebase Admin SDK

## Project Structure

```text
job-tracking-app/
  client/   React/Vite frontend
  server/   Express API and PostgreSQL schema
```

## Prerequisites

- Node.js
- npm
- PostgreSQL database
- Firebase project with Google Authentication enabled
- Firebase service account credentials for the server

## Environment Variables

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Create `server/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/job_tracking_app
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Database Setup

Run the schema against your PostgreSQL database:

```powershell
psql $env:DATABASE_URL -f server/db/schema.sql
```

The schema creates:

- `users`, keyed by Firebase UID
- `applications`, linked to users and storing job details, status, notes, and dates

## Install Dependencies

Install the client dependencies:

```powershell
cd client
npm install
```

Install the server dependencies:

```powershell
cd ../server
npm install
```

## Run Locally

Start the API:

```powershell
cd server
npm run dev
```

Start the client in another terminal:

```powershell
cd client
npm run dev
```

By default:

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api`

## Available Scripts

Client:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

Server:

```powershell
npm run dev
npm start
```

## API Routes

Health and database checks:

- `GET /api/health`
- `GET /api/db-test`

Application routes require a Firebase ID token in the `Authorization` header:

```http
Authorization: Bearer <firebase_id_token>
```

Routes:

- `GET /api/applications`
- `POST /api/applications`
- `GET /api/applications/:id`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`
- `PATCH /api/applications/:id/status`
- `GET /api/applications/status/:status`

Allowed statuses:

- `saved`
- `applied`
- `interviewing`
- `offer`
- `rejected`
- `withdrawn`

## Notes

- The server automatically creates or updates a local `users` row after validating a Firebase token.
- The client sends authenticated API requests through `client/src/lib/api.ts`.
- The API uses `DATABASE_URL` from `server/.env` through `server/src/db/pool.js`.
