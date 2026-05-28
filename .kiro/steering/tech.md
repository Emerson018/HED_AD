# Tech Stack & Build System

## Backend

- **Framework**: Django 6.0 with Django REST Framework 3.17
- **Auth**: SimpleJWT (access 30min, refresh 1 day) with custom `EmailOrUsernameBackend`
- **Database**: SQLite (dev), PostgreSQL via Supabase (prod)
- **Storage**: Supabase Storage for video/image uploads
- **Python**: 3.11+
- **Key packages**: `django-cors-headers`, `python-dotenv`, `psycopg2-binary`

## Frontend

- **Framework**: React 19 with Vite 8
- **UI Library**: Material UI (MUI) 9 with Emotion
- **Routing**: React Router 7
- **HTTP Client**: Axios with JWT interceptors (auto-refresh)
- **Supabase**: `@supabase/supabase-js` for direct file uploads
- **Linting**: ESLint 10

## Common Commands

### Backend
```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # Dev server at :8000
python manage.py createsuperuser
python manage.py expire_campaigns   # Management command to expire old campaigns
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # Vite dev server at :5173
npm run build     # Production build to frontend/dist/
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Environment Variables

Backend uses `.env` at project root (loaded via `python-dotenv`). Frontend uses `frontend/.env` for Vite env vars (prefixed `VITE_`).

## Security Patterns

- CORS strict in production (only allowed origins)
- Rate limiting: 10 login/min, 5 register/min, 500 anon/hour, 2000 user/hour
- Security headers: XSS filter, nosniff, X-Frame-Options DENY
- Frontend: auto-logout after 15min idle, secure logout (clears all storage), XSS input sanitization, role-based route protection
- TV auth: UUID tokens per device, revocable by admin
