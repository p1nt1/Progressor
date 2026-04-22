# Progressor — AI-Powered Fitness Coach

A mobile-first PWA for intermediate lifters that generates adaptive workout plans, tracks performance, and provides explainable AI coaching suggestions.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│  React PWA   │────▶│  Express API     │────▶│ PostgreSQL  │
│  (Vite)      │     │  (Node.js)       │     │ (RDS)       │
│              │     │                  │     └─────────────┘
│  Cognito     │     │  Auth Middleware  │
│  Hosted UI   │     │  (JWT verify)    │────▶ OpenAI API
└──────────────┘     └──────────────────┘      (gpt-4o-mini)
       │                     │
       └──── AWS Cognito ────┘
            (Google OAuth)
```

### AWS Services (MVP)
| Service | Purpose |
|---------|---------|
| **Cognito** | User pool + Google OAuth federation |
| **RDS (PostgreSQL)** | Database |
| **ECS Fargate** | Host Express API |
| **S3 + CloudFront** | Host React PWA static assets |

## Getting Started

### Prerequisites
- Node.js 20+
- Docker (for local PostgreSQL)
- AWS account with Cognito configured
- OpenAI API key

### 1. Setup environment
```bash
cp .env.example .env
# Fill in your values in .env
```

### 2. Start database
```bash
docker-compose up -d
```

### 3. Run migrations
```bash
npm run migrate -w server
```

### 4. Start development
```bash
npm run dev
```
This starts both the API (port 4000) and the React dev server (port 5173).

## AWS Cognito Setup (Google OAuth)

1. **Create a User Pool** in AWS Cognito console
2. **Add Google as identity provider**:
   - Go to Google Cloud Console → APIs & Credentials
   - Create OAuth 2.0 credentials (Web application)
   - Authorized redirect URI: `https://<your-cognito-domain>/oauth2/idpresponse`
   - Copy Client ID and Secret to Cognito → Federation → Identity Providers → Google
3. **Configure App Client** in Cognito:
   - Enable Google as a provider
   - Callback URL: `http://localhost:5173/callback` (dev) or your production URL
   - Allowed OAuth flows: Authorization code grant
   - Allowed scopes: `openid email profile`
4. **Update `.env`** with your Cognito values

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check (no auth) |
| `GET` | `/api/auth/session` | Current user info |
| `GET` | `/api/exercises` | List exercises (?muscleGroup=chest) |
| `POST` | `/api/workouts` | Create workout with exercises + sets |
| `GET` | `/api/workouts` | List user workouts (paginated) |
| `GET` | `/api/workouts/:id` | Workout detail with all sets |
| `PUT` | `/api/workouts/:id/complete` | Complete workout → triggers progression check |
| `GET` | `/api/workouts/history/:exerciseId` | Set history for one exercise |
| `GET` | `/api/workouts/progression/:exerciseId` | Get weight suggestion |
| `POST` | `/api/ai/generate` | AI generates a workout plan |
| `GET` | `/api/ai/explain/:exerciseId` | AI explains progression decision |

## Database Schema

- **users** — id, cognito_sub, email, display_name
- **exercises** — 30 seeded exercises with muscle group + compound flag
- **workouts** — user's training sessions (push/pull/legs/upper/lower)
- **workout_exercises** — ordered exercises within a workout
- **sets** — reps, weight, RPE, completed status
- **progression_log** — weight change history with reasons

## AI Integration

- **Workout Generation**: POST `/api/ai/generate` sends user history to GPT-4o-mini, returns a structured workout plan
- **Progression Logic** (code-based, no AI cost):
  - All sets completed at 10+ reps → increase weight (+2.5kg compound, +1.25kg isolation)
  - Same weight for 3 sessions without hitting targets → suggest 10% deload
- **Explainable Suggestions**: AI analyzes trends and explains WHY in natural language

## Project Structure

```
├── client/           # React PWA (Vite)
│   └── src/
│       ├── api/      # Axios client
│       ├── auth/     # Cognito auth provider
│       ├── workouts/ # Workout UI components
│       └── ai/       # AI suggestion cards
├── server/           # Express API
│   └── src/
│       ├── config/   # Environment validation
│       ├── db/       # Pool + migrations
│       ├── middleware/ # JWT auth
│       ├── routes/   # REST endpoints
│       ├── services/ # Business logic + AI
│       └── types/    # TypeScript types
└── docker-compose.yml
```

