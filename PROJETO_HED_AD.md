# HED AD - Sistema de Digital Signage para o Hospital Ernesto Dornelles

## Visão Geral

O **HED AD** é uma plataforma SaaS de Digital Signage (sinalização digital) desenvolvida para gerenciar a exibição de anúncios e conteúdos institucionais nas TVs do Hospital Ernesto Dornelles. O sistema permite que parceiros comerciais criem campanhas publicitárias e que a administração do hospital gerencie todo o inventário de mídia exibido nas telas.

---

## Problema que Resolve

- TVs do hospital exibiam conteúdo estático ou ficavam ociosas
- Não havia controle centralizado sobre o que era exibido em cada TV
- Parceiros comerciais não tinham autonomia para gerenciar suas campanhas
- Ausência de monetização do espaço publicitário nas TVs do hospital

---

## Proposta de Valor

1. **Monetização**: Transforma as TVs do hospital em espaço publicitário gerenciável
2. **Automação**: Carrossel automático de anúncios por turno, dia da semana e localização da TV
3. **Controle Total**: Admin aprova/rejeita campanhas, controla inventário de 300s por turno
4. **Self-Service**: Parceiros criam e gerenciam suas próprias campanhas via painel web
5. **Preenchimento Inteligente**: Campanhas institucionais preenchem automaticamente o tempo ocioso

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│              React + Vite + Material UI (MUI)                │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Login   │  │ Painel Admin │  │ Painel Parceiro    │    │
│  └──────────┘  └──────────────┘  └────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Player de TV (Fullscreen)                 │   │
│  │         Carrossel automático de campanhas              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (JWT Auth)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│              Django + Django REST Framework                   │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Auth (JWT) │  │  Campanhas   │  │  Auditoria/Logs  │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Parceiros │  │    Mídias    │  │  Monitor TV      │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     ARMAZENAMENTO                             │
│                                                              │
│  ┌────────────────────┐    ┌─────────────────────────────┐ │
│  │  SQLite (Dev) /    │    │  Supabase Storage           │ │
│  │  PostgreSQL (Prod) │    │  (Vídeos e Imagens)         │ │
│  └────────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológica

### Frontend
| Tecnologia | Função |
|---|---|
| React 18 | Framework de UI |
| Vite | Build tool e dev server |
| Material UI (MUI) | Biblioteca de componentes |
| React Router | Navegação SPA |
| Axios | Requisições HTTP |
| Supabase JS Client | Upload de mídias |

### Backend
| Tecnologia | Função |
|---|---|
| Django 6.0 | Framework web |
| Django REST Framework | API REST |
| SimpleJWT | Autenticação via tokens JWT |
| django-cors-headers | Controle de CORS |
| python-dotenv | Variáveis de ambiente |
| PostgreSQL / SQLite | Banco de dados |

### Infraestrutura
| Tecnologia | Função |
|---|---|
| Supabase Storage | Armazenamento de vídeos/imagens |
| Supabase PostgreSQL | Banco de dados em produção |

---

## Estrutura de Diretórios

```
projeto_hed_ad/
├── .env                          # Variáveis de ambiente (não commitado)
├── .env.example                  # Template de variáveis
├── manage.py                     # CLI do Django
├── requirements.txt              # Dependências Python
├── SECURITY_SSH_HARDENING.md     # Guia de segurança para VPS
│
├── hed_project/                  # Configurações do Django
│   ├── settings.py               # Settings com segurança (CORS, throttle, headers)
│   ├── urls.py                   # Rotas principais
│   └── wsgi.py / asgi.py        # Entry points do servidor
│
├── signage/                      # App principal do Django
│   ├── models.py                 # Modelos: Usuario, Parceiro, Campanha, Midia, MonitorTV, etc.
│   ├── views.py                  # Views: CRUD campanhas, playlist TV, registro, logs
│   ├── serializers.py            # Serialização de dados (JSON)
│   ├── permissions.py            # Permissões customizadas
│   ├── backends.py               # Auth backend (login por email ou username)
│   ├── admin.py                  # Painel admin Django
│   └── migrations/               # Migrações do banco de dados
│
└── frontend/                     # Aplicação React
    ├── src/
    │   ├── App.jsx               # Rotas e layout principal
    │   ├── components/
    │   │   ├── Layout.jsx        # Sidebar + auto-logout por inatividade
    │   │   ├── CarouselLivePreview.jsx  # Player com máscara L-bar
    │   │   ├── SmartVideoPlayer.jsx     # Player inteligente (blur vertical)
    │   │   └── ProtectedRoute.jsx       # Proteção de rotas por role
    │   ├── pages/
    │   │   ├── Login.jsx                # Tela de login (username ou email)
    │   │   ├── AdminDashboard.jsx       # Dashboard do administrador
    │   │   ├── AdminPreview.jsx         # Simulador de transmissão
    │   │   ├── AdminCampanhaInstitucional.jsx  # Criar campanha institucional
    │   │   ├── AdminNovoUsuario.jsx     # Criar conta de parceiro
    │   │   ├── AdminOpcoes.jsx          # Página de opções (FAQ/Termos)
    │   │   ├── SystemLogs.jsx           # Logs de auditoria
    │   │   ├── ParceiroDashboard.jsx    # Criar/editar campanha (parceiro)
    │   │   ├── MinhasCampanhas.jsx      # Listar campanhas do parceiro
    │   │   ├── PlayerView.jsx           # Player fullscreen para TVs
    │   │   ├── Faq.jsx                  # Perguntas frequentes
    │   │   └── TermosDeUso.jsx          # Termos de uso
    │   └── utils/
    │       ├── api.js                   # Axios com interceptors JWT
    │       ├── supabaseClient.js        # Upload com progresso
    │       ├── useIdleTimeout.js        # Hook de auto-logout por inatividade
    │       ├── secureLogout.js          # Logout seguro (limpa sessão)
    │       └── sanitize.js              # Sanitização de inputs (anti-XSS)
    └── vite.config.js
```

---

## Funcionalidades por Perfil

### Administrador HED
- Dashboard com KPIs (total campanhas, pendentes, ativas, expiradas)
- Ocupação do inventário por turno/dia/TV (gráfico visual)
- Aprovar/pausar/excluir campanhas
- Criar campanhas institucionais (tapa-buracos)
- Simulador de transmissão (preview real do que a TV exibe)
- Criar contas de parceiros comerciais
- Logs de auditoria completos (login, criação, edição, exclusão)
- Gerenciar URLs de transmissão para TVs físicas

### Parceiro Comercial
- Criar novas campanhas com upload de vídeo/imagem
- Selecionar turnos, dias da semana e TVs de exibição
- Visualizar simulação da TV em tempo real
- Editar campanhas pendentes
- Acompanhar status (pendente, aprovada, expirada)
- Ver total de exibições por campanha

### Player de TV (Mini-PC)
- Carrossel automático de campanhas aprovadas
- Filtragem por turno atual, dia da semana e TV
- Máscara L-bar lateral (logo hospital, relógio, dicas de saúde)
- Preenchimento inteligente com campanhas institucionais
- Autenticação por token UUID (revogável pelo admin)

---

## Modelo de Negócio - Inventário

- Cada turno (Manhã, Tarde, Noite, Madrugada) possui **300 segundos** de inventário comercial
- Campanhas comerciais consomem esse inventário ao serem aprovadas
- O tempo restante é preenchido automaticamente por campanhas institucionais
- O inventário é controlado por **dia da semana** e por **TV específica**
- Validação impede aprovação de campanhas que excedam o limite

---

## Segurança Implementada

### Backend
- CORS estrito (apenas origens autorizadas em produção)
- Rate limiting: 10 tentativas de login/minuto (anti brute-force)
- Security headers: XSS filter, Content-Type nosniff, X-Frame-Options DENY
- JWT com access token de 30 minutos
- Auditoria completa de todas as ações
- Tokens UUID revogáveis para TVs físicas (MonitorTV)
- Validação de username (apenas minúsculas, números, ponto, vírgula)
- Backend de autenticação customizado (login por email ou username)

### Frontend
- Auto-logout por inatividade (15 minutos)
- Logout seguro (limpa localStorage, sessionStorage, impede botão "Voltar")
- Sanitização de inputs (prevenção XSS)
- Rotas protegidas por role (admin vs parceiro)
- Interceptor JWT com refresh automático de token

---

## Fluxo Principal

```
1. Admin cria conta do parceiro → /admin/novo-usuario
2. Parceiro faz login → /login
3. Parceiro cria campanha com vídeo → /parceiro/upload
4. Campanha entra em status "Pendente" (EM_ANALISE)
5. Admin visualiza e aprova a campanha → /admin
6. Campanha entra no carrossel da TV no turno/dia configurado
7. Player da TV busca playlist via API → /api/tv/playlist/
8. Vídeo é exibido com máscara L-bar do hospital
9. Logs de exibição são registrados automaticamente
```

---

## Benefícios para o Hospital

| Benefício | Descrição |
|---|---|
| **Receita** | Nova fonte de receita com venda de espaço publicitário |
| **Controle** | Aprovação centralizada de todo conteúdo exibido |
| **Automação** | Sem intervenção manual para trocar conteúdo nas TVs |
| **Escalabilidade** | Adicionar novas TVs é apenas criar um novo token |
| **Segurança** | Tokens revogáveis, auditoria completa, rate limiting |
| **Experiência** | Conteúdo relevante para pacientes (dicas de saúde, relógio) |
| **Self-service** | Parceiros gerenciam suas próprias campanhas |

---

## Como Executar (Desenvolvimento)

### Backend
```bash
pip install -r requirements.txt
cp .env.example .env  # Preencha as variáveis
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Acessos
- Frontend: http://localhost:5173
- API: http://localhost:8000/api/
- Admin Django: http://localhost:8000/admin/

---

## Próximos Passos (Roadmap)

- [ ] Deploy em produção (Vercel + Railway/Render)
- [ ] Ativar HTTPS e headers HSTS
- [ ] Ativar rotação de refresh tokens (token_blacklist)
- [ ] Dashboard de analytics (gráficos de exibições por campanha)
- [ ] Notificações por email (campanha aprovada/expirada)
- [ ] App mobile para parceiros
- [ ] Integração com sistema de faturamento
