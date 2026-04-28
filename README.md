# Progressor — AI-Powered Fitness Coach

A mobile-first PWA for intermediate lifters that generates adaptive workout plans, tracks performance, and provides explainable AI coaching suggestions.

Built with **React**, **Express**, **PostgreSQL**, and **OpenAI** — deployed on **Netlify** (client) + **Railway** (API).

🚀 **Live app:** [https://joyful-starship-7665f4.netlify.app/](https://joyful-starship-7665f4.netlify.app/)

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│  React PWA   │────▶│  Express API     │────▶│ PostgreSQL  │
│  (Vite)      │     │  (Node.js)       │     └─────────────┘
│              │     │                  │
│  Google      │     │  Auth Middleware  │
│  Identity    │     │  (JWT sessions)  │────▶ OpenAI API
└──────────────┘     └──────────────────┘      
       │                     │
       └──── Google OAuth ───┘
            (One Tap / Popup)
```

| Layer | Tech | Hosting |
|-------|------|---------|
| **Client** | React 18, Vite, Redux Toolkit, React Query, PWA | Netlify |
| **API** | Express, Zod, JWT sessions, OpenAI SDK | Railway |
| **Database** | PostgreSQL 16 | Railway (or local Docker) |
| **Auth** | Google Identity Services → server-side JWT cookie | — |

## Features

- 🏋️ **Workout tracking** — log sets, reps, weight with real-time rest timer
- 🤖 **AI workout generation** — GPT-4.1-mini creates personalised plans based on your history & profile
- 📊 **Post-workout AI review** — compares current session to your last workout of the same type
- 💾 **Workout templates** — save & reuse your favourite routines
- 🌙 **Dark / light theme** — persisted to localStorage
- 📱 **PWA** — installable on mobile with offline shell

## Engineering Highlights

- **Monorepo** — npm workspaces with shared ESLint flat config and unified CI
- **Centralised error handling** — custom `AppError` class + `asyncHandler` wrapper eliminates try-catch boilerplate across all routes
- **Request validation** — Zod schemas on every mutating endpoint; `validateBody` middleware strips unknown keys before handlers run
- **Security hardening** — Helmet headers, rate limiting (auth + AI + general), httpOnly JWT cookies, CORS allow-list
- **Request logging** — Morgan with format toggling (`dev` / `combined`) by environment
- **DB health check** — `/api/health` verifies PostgreSQL connectivity (used by Railway healthcheck probe)
- **Bootstrap endpoint** — single `GET /api/bootstrap` aggregates profile, templates, workouts, and stats in parallel to eliminate waterfall on app load
- **Type-safe DB queries** — `unknown[]` params, explicit row types for query results

## Getting Started

### Prerequisites

- **Node.js 20+** and npm
- **Docker** (for local PostgreSQL)
- **Google Cloud** project with OAuth 2.0 credentials
- **OpenAI API key** (optional — AI features degrade gracefully)

### 1. Clone & install

```bash
git clone https://github.com/p1nt1/progressor.git
cd progressor
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials — see [`.env.example`](.env.example) for all variables.

### 3. Start the database

```bash
docker compose up -d
```

### 4. Run migrations

```bash
npm run migrate
```

### 5. Start development

```bash
npm run dev
```

This starts both the API (`http://localhost:4000`) and the React dev server (`http://localhost:5173`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start client + server concurrently |
| `npm run build` | Build both client & server for production |
| `npm run typecheck` | Type-check both workspaces |
| `npm run lint` | Lint both workspaces with ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run migrate` | Run SQL migrations against the database |
| `npm run validate` | Full CI check: typecheck + lint + build |

## API Endpoints

All mutating endpoints validate request bodies with Zod schemas. Auth endpoints are rate-limited (20 req / 15 min); AI endpoints are rate-limited (10 req / min).

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `GET` | `/api/health` | ✗ | Health check (DB connectivity) |
| `POST` | `/api/auth/login` | ✗ | Exchange Google ID token for session cookie |
| `POST` | `/api/auth/register` | ✗ | Register with username + password |
| `POST` | `/api/auth/login-local` | ✗ | Login with username + password |
| `POST` | `/api/auth/logout` | ✗ | Clear session cookie |
| `GET` | `/api/auth/session` | ✓ | Current user info |
| `GET` | `/api/exercises` | ✓ | List exercises (?muscleGroup=chest) |
| `POST` | `/api/exercises` | ✓ | Create custom exercise |
| `POST` | `/api/workouts` | ✓ | Create workout with exercises + sets |
| `GET` | `/api/workouts` | ✓ | List user workouts (paginated) |
| `GET` | `/api/workouts/:id` | ✓ | Workout detail with all sets |
| `PUT` | `/api/workouts/:id/complete` | ✓ | Complete workout |
| `GET` | `/api/workouts/stats` | ✓ | Workout stats (total, streak, 1RM) |
| `GET` | `/api/workouts/history/:exerciseId` | ✓ | Set history for one exercise |
| `POST` | `/api/ai/generate` | ✓ | AI generates a workout plan |
| `POST` | `/api/ai/review-workout` | ✓ | AI reviews completed workout |
| `GET` | `/api/bootstrap` | ✓ | Fetch all initial data in one request |
| `GET/PUT` | `/api/profile` | ✓ | Get / update user profile |
| `GET/POST/DELETE` | `/api/templates` | ✓ | Manage workout templates |

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | id, cognito_sub (Google sub), email, display_name |
| `profiles` | height, weight, sex, DOB, experience, goals, split config |
| `exercises` | 70+ seeded exercises with muscle group + compound flag |
| `workouts` | user's training sessions with AI review JSON |
| `workout_exercises` | ordered exercises within a workout |
| `sets` | reps, weight, RPE, completed status |
| `workout_templates` | saved exercise/set templates per user |

## AI Integration

- **Workout Generation** — sends user profile + last 50 completed sets to GPT-4.1-mini; returns structured JSON plan
- **Post-Workout Review** — diffs are computed server-side (verdict is deterministic); AI writes only the narrative

## Project Structure

```
├── .github/workflows/      # GitHub Actions CI pipeline
├── client/                  # React PWA (Vite)
│   └── src/
│       ├── api/             # Axios client & API helpers
│       ├── components/      # Reusable UI components
│       ├── helpers/         # Workout logic & split config
│       ├── hooks/           # useAuth, useTheme, React Query hooks
│       ├── pages/           # Route-level page components
│       ├── store/           # Redux Toolkit slices (workout, user)
│       ├── styles/          # Global CSS design tokens
│       └── types/           # Shared TypeScript types
├── server/                  # Express API
│   └── src/
│       ├── config/          # Environment validation (Zod)
│       ├── db/              # Connection pool + SQL migrations
│       ├── middleware/       # Auth, error handling, validation
│       ├── modules/         # Feature modules (auth, workout, ai, …)
│       │   └── <module>/
│       │       ├── *.routes.ts    # Express router
│       │       ├── *.service.ts   # Business logic
│       │       └── *.schemas.ts   # Zod request schemas
│       └── types/           # Server-side TypeScript types
├── docker-compose.yml       # Local PostgreSQL (with healthcheck)
├── eslint.config.js         # Shared ESLint (flat config)
├── netlify.toml             # Client deployment config
└── railway.json             # Server deployment config
```

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| **Client** | Netlify | Auto-deploys from `client/`; API calls proxied to Railway |
| **Server** | Railway | Nixpacks build; runs migrations on deploy |
| **Database** | Railway | Managed PostgreSQL plugin |

