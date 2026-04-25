# Ayn Backend

FastAPI backend for the Ayn platform.

## Stack

- FastAPI
- Prisma ORM
- PostgreSQL / Supabase
- Pytest

## Setup

1. `cd backend`
2. Copy env template: `cp env.template .env`
3. Fill required values in `.env`
4. Install dependencies: `pip install -r requirements.txt`
5. Generate Prisma client (if needed): `python -m prisma generate`

## Run

- `uvicorn main:app --reload --port 8000`

## Test

- `pytest -q`

## Architecture (high-level)

- `app/auth` - auth and user identity flows
- `app/evidence` - evidence ingestion/management
- `app/standards` - standards and criteria logic
- `app/gap_analysis` - readiness and gap workflows
- `app/horus` / `app/ai` - AI interaction and orchestration
- `app/bootstrap` - startup bootstrap tasks (seeding, optional debug routes)
- `main.py` - app assembly, middleware, routing

## Security defaults

- CORS origins come from configured allow-list (`CORS_ORIGINS` + known local defaults).
- Debug routes require both:
  - `DEBUG=True`
  - `ENABLE_DEBUG_ENDPOINTS=True`
