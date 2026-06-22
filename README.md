# Stratify

Stratify is a founder strategy workspace that generates source-aware startup reports, live market signals, and execution plans. It runs in two modes:

- **Grounded demo mode:** used when `GEMINI_API_KEY` is missing. It does not call Gemini and does not claim live market data.
- **Live Gemini mode:** used when `GEMINI_API_KEY` is set. Gemini synthesizes the founder context, research, strategy, and execution plan.
- **Live web intelligence:** used when `TAVILY_API_KEY` is set. Tavily retrieves recent web/news signals that are ranked and cited in reports.

## Setup

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

To use Gemini, set `GEMINI_API_KEY` in `.env`. To enable real-time market/news signals, set `TAVILY_API_KEY`.

The app starts with founder onboarding and stores the founder profile locally in the browser for this version. Optional source context can be added through source cards in the UI.

```json
[
  {
    "title": "Internal market brief",
    "url": "https://example.com/brief",
    "summary": "Key points from a reviewed market or company source."
  }
]
```

If no sources are provided, the app uses a local grounding policy that tells the model to avoid invented claims and label assumptions.

## API

### `GET /api/health`

Returns server health, runtime mode, and configured model.

### `GET /api/ready`

Checks required runtime dependencies, including the report store.

### `GET /api/metrics`

Returns process-local request and report counters. If `API_AUTH_TOKEN` is configured, send `Authorization: Bearer <token>`.

### Authentication

Authentication is server-side and cookie based. Session cookies are `HttpOnly`, expire automatically, and are marked `Secure` in production.

- `POST /api/auth/register`: creates a user with a scrypt-hashed password and queues an email verification token server-side.
- `POST /api/auth/verify-email`: verifies the email with an expiring token.
- `POST /api/auth/login`: requires a verified email, rate limits attempts, and sets an expiring session cookie.
- `POST /api/auth/logout`: deletes the current session and clears the cookie.
- `GET /api/auth/me`: returns the current authenticated user.
- `POST /api/auth/request-password-reset`: queues a reset token server-side and always returns a generic response.
- `POST /api/auth/reset-password`: accepts an expiring reset token, updates the password hash, and invalidates active sessions.

Verification and reset tokens are never returned to the frontend. The current file-backed mail outbox is a backend integration point for an SMTP/provider adapter.

### `GET /api/reports`

Lists stored report summaries. Supports `?limit=25`.

### `GET /api/reports/:id`

Fetches a full stored report by id.

### `DELETE /api/reports/:id`

Deletes a stored report.

### `POST /api/analyze`

Backward-compatible endpoint that creates and stores a report.

### `POST /api/reports`

Request body:

```json
{
  "query": "Assess expansion risk for green hydrogen suppliers in the EU",
  "founderProfile": {
    "founderType": "technical",
    "startupStage": "validating",
    "industry": "climate SaaS",
    "geography": "EU",
    "product": "AI procurement tool for green hydrogen buyers",
    "targetCustomer": "industrial energy procurement teams",
    "teamSize": "2 founders",
    "budget": "bootstrapped",
    "timeline": "30 days",
    "currentGoal": "validate buyer urgency"
  },
  "reportOptions": {
    "reportType": "idea_validation",
    "audience": "founder",
    "timeHorizon": "30_days"
  },
  "sources": [
    {
      "title": "Reviewed source",
      "url": "https://example.com",
      "summary": "Source notes used to ground the report."
    }
  ]
}
```

Validation rules:

- `query` is required, 8 to 500 characters.
- `founderProfile` must include industry, geography, product, target customer, and current goal.
- `reportOptions` supports `market_pulse`, `idea_validation`, `competitor_brief`, `gtm_strategy`, `investor_memo`, `risk_radar`, and `execution_plan`.
- `sources` is optional and must be an array of at most 8 objects.
- Each source needs `summary` or `content`.

## Configuration

- `PORT`: server port, default `3000`.
- `GEMINI_API_KEY`: enables live Gemini mode.
- `GEMINI_MODEL`: Gemini model name, default `gemini-1.5-flash`.
- `TAVILY_API_KEY`: enables real-time web/news intelligence.
- `API_AUTH_TOKEN`: optional bearer token for report management and metrics endpoints.
- `AUTH_STORE_PATH`: optional JSON file path for persisted users, sessions, tokens, and backend email outbox.
- `SESSION_TTL_MS`: session lifetime, default 7 days.
- `EMAIL_VERIFICATION_TOKEN_TTL_MS`: email verification token lifetime, default 24 hours.
- `PASSWORD_RESET_TOKEN_TTL_MS`: password reset token lifetime, default 30 minutes.
- `LOGIN_RATE_LIMIT_WINDOW_MS` and `LOGIN_RATE_LIMIT_MAX`: login/reset request throttling.
- `REQUIRE_AUTH_FOR_ANALYZE`: set `true` to require authentication for the legacy `/api/analyze` endpoint.
- `CORS_ORIGINS`: comma-separated allowed browser origins.
- `JSON_BODY_LIMIT`: Express JSON body size limit.
- `REQUEST_TIMEOUT_MS`: analysis timeout.
- `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`: simple in-memory API rate limit.
- `REPORT_STORE_PATH`: optional JSON file path for persisted reports.
- `MAX_STORED_REPORTS`: number of reports retained by the file store.

## Backend Production Notes

- Reports are persisted to a JSON file store by default (`data/reports.json`).
- Users, hashed passwords, sessions, email verification tokens, and password reset tokens are stored server-side by default (`data/auth.json`).
- The report store is implemented behind an interface so it can be replaced with PostgreSQL, SQLite, or another durable store later.
- Tavily search calls use timeouts, retry on transient failures, and cache identical requests briefly.
- Errors use a consistent envelope: `{ "error": { "code", "message", "requestId", "details" } }`.
- Every request receives an `X-Request-Id` response header and structured JSON logs.

## Quality Checks

```bash
npm test
npm run audit:prod
```

The test suite covers request validation, orchestrator demo behavior, API errors, and a start-up smoke check.
