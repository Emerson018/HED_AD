# Project Structure

```
projeto_hed_ad/
├── manage.py                     # Django CLI entry point
├── requirements.txt              # Python dependencies
├── .env / .env.example           # Backend environment variables
├── db.sqlite3                    # Local dev database
│
├── hed_project/                  # Django project config
│   ├── settings.py               # All settings (CORS, JWT, throttle, DB)
│   ├── urls.py                   # Root URL routing (admin, token, api/)
│   ├── wsgi.py / asgi.py        # Server entry points
│
├── signage/                      # Main Django app
│   ├── models.py                 # Usuario, Parceiro, Campanha, Midia, MonitorTV, AuditoriaLog
│   ├── views.py                  # ViewSets + custom views (TVPlaylist, Register, AuditedLogin)
│   ├── serializers.py            # DRF serializers
│   ├── permissions.py            # Custom permissions (IsAdminOuDonoDaCampanha)
│   ├── backends.py               # EmailOrUsernameBackend
│   ├── urls.py                   # App-level URL routing
│   ├── admin.py                  # Django admin config
│   ├── management/commands/      # expire_campaigns management command
│   └── migrations/               # Database migrations
│
└── frontend/                     # React SPA
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env                      # VITE_ prefixed env vars
    └── src/
        ├── App.jsx               # Route definitions + theme provider
        ├── main.jsx              # React entry point
        ├── theme.js              # MUI theme (light/dark)
        ├── components/
        │   ├── Layout.jsx        # Sidebar navigation + auto-logout hook
        │   ├── ProtectedRoute.jsx # Role-based route guard
        │   ├── CarouselLivePreview.jsx  # TV player with L-bar mask
        │   └── SmartVideoPlayer.jsx     # Video player with blur effect
        ├── pages/                # One file per route/screen
        │   ├── Login.jsx
        │   ├── AdminDashboard.jsx
        │   ├── ParceiroDashboard.jsx    # Campaign creation/edit form
        │   ├── PlayerView.jsx           # Fullscreen TV player
        │   └── ...
        └── utils/
            ├── api.js            # Axios instance with JWT interceptors
            ├── supabaseClient.js # Supabase upload with progress
            ├── useIdleTimeout.js # Auto-logout hook (15min)
            ├── secureLogout.js   # Clears all storage on logout
            └── sanitize.js       # XSS input sanitization
```

## Architecture Notes

- Backend exposes a REST API under `/api/` consumed by the React SPA.
- The frontend is a standalone Vite project (not served by Django).
- TV players are unauthenticated (use device UUID token via query param).
- All audit-worthy actions create `AuditoriaLog` entries server-side.
- Custom user model (`signage.Usuario`) extends `AbstractUser` with `tipo_usuario` field.
