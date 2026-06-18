<p align="center">
  <img src="frontend/src/assets/logo-hed.png" alt="HED AD" width="80" />
</p>

<h1 align="center">HED AD — Digital Signage</h1>

<p align="center">
  Plataforma de gerenciamento de mídia digital para as TVs do<br/>
  <strong>Hospital Ernesto Dornelles</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Django-6.0-092E20?logo=django&logoColor=white" />
  <img src="https://img.shields.io/badge/MUI-Material%20UI-007FFF?logo=mui&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Storage-3ECF8E?logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?logo=jsonwebtokens&logoColor=white" />
</p>

---

## Sobre o Projeto

O **HED AD** transforma as TVs do hospital em um canal de mídia inteligente e monetizável. Parceiros comerciais criam campanhas publicitárias via painel web, a administração aprova e controla o inventário, e as TVs exibem automaticamente um carrossel de anúncios organizado por turno, dia da semana e localização.

### Destaques

- 🖥️ **Player automático** com máscara institucional (logo, relógio, dicas de saúde)
- 📊 **Dashboard administrativo** com KPIs, ocupação por turno e gestão completa
- 🎬 **Upload inteligente** com barra de progresso e detecção automática de duração
- 🔒 **Segurança** — CORS estrito, rate limiting, auto-logout, tokens revogáveis
- 🏥 **Campanhas institucionais** preenchem automaticamente o tempo ocioso

---

## Arquitetura

```
Frontend (React + Vite + MUI)
        │
        │  REST API + JWT
        ▼
Backend (Django + DRF)
        │
        ├── PostgreSQL / SQLite
        └── Supabase Storage (vídeos/imagens)
```

---

## Funcionalidades

| Perfil | Recursos |
|--------|----------|
| **Admin** | Aprovar campanhas, criar usuários, simulador de TV, logs de auditoria, campanhas institucionais |
| **Parceiro** | Criar/editar campanhas, upload de vídeo, acompanhar status e exibições |
| **Player TV** | Carrossel automático por turno/dia/TV, máscara L-bar, token UUID revogável |

---

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 18, Vite, Material UI, React Router, Axios |
| Backend | Django 6.0, Django REST Framework, SimpleJWT |
| Storage | Supabase Storage (vídeos/imagens) |
| Banco | PostgreSQL (prod) / SQLite (dev) |
| Segurança | CORS, Rate Limiting, JWT, Auto-logout, Sanitização XSS |

---

## Início Rápido

### Pré-requisitos

- Python 3.11+
- Node.js 18+
- npm ou yarn

### Backend

```bash
# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Rodar migrações e criar superusuário
python manage.py migrate
python manage.py createsuperuser

# Iniciar servidor com venv
.\venv\Scripts\activate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Acessos

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api/ |
| Admin Django | http://localhost:8000/admin/ |

---

## Estrutura do Projeto

```
projeto_hed_ad/
├── hed_project/          # Configurações Django (settings, urls)
├── signage/              # App principal (models, views, serializers)
├── frontend/
│   └── src/
│       ├── components/   # Layout, Player, Carousel
│       ├── pages/        # Todas as páginas da aplicação
│       └── utils/        # API, hooks, segurança
├── .env.example          # Template de variáveis de ambiente
├── requirements.txt      # Dependências Python
└── PROJETO_HED_AD.md     # Documentação técnica completa
```

---

## Segurança

- **Backend**: CORS estrito, rate limiting (10 login/min), security headers, tokens UUID revogáveis para TVs
- **Frontend**: Auto-logout por inatividade (15 min), logout seguro, sanitização de inputs, rotas protegidas por role
- **Infraestrutura**: Variáveis de ambiente via `.env`, guia de hardening SSH incluído

---

## Screenshots

> *Em breve*

---

## Licença

Projeto privado — Hospital Ernesto Dornelles © 2026

---

<p align="center">
  Desenvolvido por <strong>Emerson Lima</strong>
</p>
