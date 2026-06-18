# Implementation Plan: Email Credentials & Password Reset

## Overview

This plan implements transactional email capabilities, random password generation, and a complete "forgot password" flow for the HED AD platform. The implementation is split into backend services (email adapter pattern, token management, API views, throttling) and frontend pages/modifications (EsqueciSenha, RedefinirSenha, Login link, AdminNovoUsuario button).

## Tasks

- [x] 1. Set up backend infrastructure and data models
  - [x] 1.1 Create PasswordResetToken model and migration
    - Add `PasswordResetToken` model to `signage/models.py` with fields: `user` (FK to Usuario), `token` (CharField max_length=64, unique, db_index), `created_at` (DateTimeField auto_now_add), `used_at` (DateTimeField null), `is_used` (BooleanField default=False)
    - Add `is_expired` and `is_valid` properties
    - Add new ACAO_CHOICES entries to AuditoriaLog: `EMAIL_CREDENCIAIS`, `EMAIL_CREDENCIAIS_FALHA`, `SENHA_REDEFINIDA`
    - Run `python manage.py makemigrations` and `python manage.py migrate`
    - _Requirements: 3.6, 3.7, 4.8_

  - [x] 1.2 Add email service environment variables to settings
    - Add `EMAIL_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_PROVIDER`, `FRONTEND_URL` to `hed_project/settings.py` reading from `os.environ`
    - Add new throttle rate `'password_reset': '10/hour'` to `REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']`
    - Update `.env.example` with the new variables
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.3 Create email provider adapters module
    - Create `signage/services/__init__.py`
    - Create `signage/services/email_adapters.py` with `EmailProviderAdapter` ABC and concrete implementations: `ResendAdapter`, `SendGridAdapter`, `BrevoAdapter`
    - Each adapter implements `send(from_addr, to, subject, html_body) -> bool`
    - _Requirements: 6.3, 6.6_

- [x] 2. Implement core backend services
  - [x] 2.1 Implement password generator utility
    - Create `signage/services/password_generator.py` with `generate_password(length=None) -> str`
    - Use `secrets` module for cryptographic randomness
    - Length randomly chosen between 12-16 if not specified
    - Guarantee at least 1 uppercase, 1 lowercase, 1 digit, 1 special char from `!@#$%^&*`
    - _Requirements: 2.2, 2.4_

  - [x]* 2.2 Write property test for password generation — policy compliance
    - **Property 1: Password generation satisfies policy**
    - **Validates: Requirements 2.2**
    - Create `signage/tests/test_password_generator.py` using Hypothesis
    - Assert length 12-16, contains uppercase, lowercase, digit, special char

  - [x]* 2.3 Write property test for password generation — non-determinism
    - **Property 2: Password generation is non-deterministic**
    - **Validates: Requirements 2.4**
    - Assert two consecutive calls produce different results (100 iterations)

  - [x] 2.4 Implement token manager service
    - Create `signage/services/token_manager.py` with `TokenManager` class
    - `generate_token(user)`: invalidate existing tokens for user, create new PasswordResetToken with `secrets.token_urlsafe(48)`
    - `validate_token(token_str)`: return `(is_valid, error_reason, user)` checking existence, expiry, used status
    - `mark_used(token_str)`: set `is_used=True` and `used_at=now()`
    - _Requirements: 3.6, 3.7, 3.8_

  - [x]* 2.5 Write property tests for token manager
    - **Property 6: Token expiration after 30 minutes**
    - **Property 7: Token single-use enforcement**
    - **Property 8: Token invalidation on new request**
    - **Validates: Requirements 3.6, 3.7, 3.8**
    - Create `signage/tests/test_token_manager.py` using Hypothesis and Django TestCase

  - [x] 2.6 Implement email service with retry logic
    - Create `signage/services/email_service.py` with `EmailService` class
    - `send_credentials_email(user, password)`: compose HTML from template, send with retry
    - `send_reset_email(user, token)`: compose HTML from template, send with retry
    - `_send_with_retry(to, subject, html, max_retries=3)`: retry loop with 5s delay between attempts
    - `_get_provider()`: resolve adapter from `EMAIL_PROVIDER` setting
    - Handle configuration validation (missing keys in DEBUG vs prod mode)
    - _Requirements: 1.1, 1.6, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x]* 2.7 Write property tests for email service
    - **Property 3: Credentials email content completeness**
    - **Property 12: Reset email content completeness**
    - **Property 13: Email subject line constraints**
    - **Property 16: Invalid sender address configuration validation**
    - **Validates: Requirements 1.1, 1.2, 5.1, 5.4, 6.7**
    - Create `signage/tests/test_email_service.py` using Hypothesis

- [x] 3. Create email templates
  - [x] 3.1 Create credentials email HTML template
    - Create `signage/templates/emails/credentials_email.html`
    - Include HED Campanhas branding, platform name, login URL, username, password
    - Use inline CSS for email client compatibility
    - All text in pt-BR
    - _Requirements: 1.2, 1.3_

  - [x] 3.2 Create password reset email HTML template
    - Create `signage/templates/emails/password_reset_email.html`
    - Include platform name "HED Campanhas", user's first_name, clickable "Redefinir Senha" button with reset link
    - Include 30-minute expiration notice and disclaimer "Se você não solicitou esta redefinição, ignore este e-mail."
    - All text in pt-BR
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Implement API views and throttling
  - [x] 4.1 Create custom throttle classes
    - Create `signage/throttles.py` with `PasswordResetEmailThrottle` (3/email/hour) and `PasswordResetIPThrottle` (10/IP/hour)
    - `PasswordResetEmailThrottle.get_cache_key`: uses email from request body
    - `PasswordResetIPThrottle.get_cache_key`: uses client IP via `get_ident()`
    - _Requirements: 7.1, 7.2, 7.3_

  - [x]* 4.2 Write property tests for rate limiting
    - **Property 14: Rate limiting enforcement**
    - **Property 15: Rate limit response format**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
    - Create `signage/tests/test_throttles.py`

  - [x] 4.3 Implement PasswordResetRequestView
    - Add `PasswordResetRequestView` to `signage/views.py` (or a new `signage/views_password_reset.py`)
    - POST `/api/password-reset/request/` with `{email}`
    - Apply both custom throttle classes
    - Lookup user by email, generate token, send reset email
    - Always return same response regardless of email existence (anti-enumeration)
    - Include `Retry-After` header on 429 responses
    - _Requirements: 3.3, 3.4, 7.4, 7.5_

  - [x]* 4.4 Write property test for email enumeration protection
    - **Property 4: Email enumeration protection**
    - **Validates: Requirements 3.4**
    - Create `signage/tests/test_password_reset_views.py`

  - [x] 4.5 Implement ValidateResetTokenView
    - GET `/api/password-reset/validate-token/?token=xxx`
    - Use TokenManager to validate, return `{valid: true}` or `{valid: false, reason: '...'}`
    - _Requirements: 4.5, 4.6, 4.7_

  - [x] 4.6 Implement PasswordResetConfirmView
    - POST `/api/password-reset/confirm/` with `{token, password, password_confirm}`
    - Validate token, validate password against Politica_Senha, update user password
    - Mark token as used, log `SENHA_REDEFINIDA` to AuditoriaLog
    - _Requirements: 4.1, 4.2, 4.3, 4.8_

  - [x]* 4.7 Write property test for password reset execution
    - **Property 9: Password reset execution with valid inputs**
    - **Validates: Requirements 4.2**
    - Add to `signage/tests/test_password_reset_views.py`

  - [x] 4.8 Integrate email sending into RegisterView
    - Modify existing `RegisterView` in `signage/views.py` to call `EmailService.send_credentials_email()` after successful user creation
    - Add `email_sent` field to the success response
    - Log `EMAIL_CREDENCIAIS` or `EMAIL_CREDENCIAIS_FALHA` to AuditoriaLog
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

  - [x] 4.9 Register new URL routes
    - Add to `signage/urls.py`:
      - `path('password-reset/request/', PasswordResetRequestView.as_view())`
      - `path('password-reset/confirm/', PasswordResetConfirmView.as_view())`
      - `path('password-reset/validate-token/', ValidateResetTokenView.as_view())`
    - _Requirements: 3.3, 4.1_

- [x] 5. Checkpoint - Backend verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement frontend pages and utilities
  - [x] 6.1 Create client-side password generator utility
    - Create `frontend/src/utils/passwordGenerator.js`
    - Export `generatePassword()` function: length 12-16, guarantees uppercase, lowercase, digit, special char from `!@#$%^&*`
    - _Requirements: 2.2, 2.4_

  - [x] 6.2 Create EsqueciSenha page
    - Create `frontend/src/pages/EsqueciSenha.jsx`
    - Single email input field (max 254 chars) with submit button
    - Client-side email format validation (inline error in pt-BR, no API call on invalid)
    - On success: show confirmation message "Instruções enviadas para o e-mail informado."
    - On 429: show "Muitas tentativas. Aguarde antes de tentar novamente."
    - On network error: show "Erro de conexão. Tente novamente."
    - Link back to login page
    - Use MUI components consistent with existing pages
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x]* 6.3 Write property test for client-side email validation
    - **Property 5: Client-side email format validation**
    - **Validates: Requirements 3.5**
    - Create `frontend/src/__tests__/EsqueciSenha.test.jsx`

  - [x] 6.4 Create RedefinirSenha page
    - Create `frontend/src/pages/RedefinirSenha.jsx`
    - Extract token from URL param (route: `/redefinir-senha/:token`)
    - On mount: call `GET /api/password-reset/validate-token/?token=xxx`
    - If invalid: show appropriate error message with link to `/esqueci-senha`
    - If valid: show new password + confirmation fields with password requirements checklist
    - Client-side validation: policy check, confirmation match (inline errors in pt-BR)
    - On successful reset: redirect to `/login` with success snackbar within 3 seconds
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x]* 6.5 Write property tests for password validation UI
    - **Property 10: Password policy validation feedback**
    - **Property 11: Password confirmation mismatch detection**
    - **Validates: Requirements 4.3, 4.4**
    - Create `frontend/src/__tests__/RedefinirSenha.test.jsx`

  - [x] 6.6 Modify Login.jsx — add "Esqueci minha senha" link
    - Add a `Link` component below the login button navigating to `/esqueci-senha`
    - Text: "Esqueci minha senha"
    - Style consistent with existing page design
    - _Requirements: 3.1_

  - [x] 6.7 Modify AdminNovoUsuario.jsx — add "Gerar Senha" button
    - Import `generatePassword` from `utils/passwordGenerator.js`
    - Add "Gerar Senha" button adjacent to the password field
    - On click: generate password, set field value, toggle visibility to show, update requirements checklist
    - After successful form submission: show email send status in snackbar (based on `email_sent` response field)
    - _Requirements: 2.1, 2.2, 2.3, 1.1_

  - [x] 6.8 Register new routes in App.jsx
    - Import `EsqueciSenha` and `RedefinirSenha` pages
    - Add routes: `/esqueci-senha` (public) and `/redefinir-senha/:token` (public)
    - _Requirements: 3.2, 4.1_

- [x] 7. Checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration tests and final wiring
  - [x]* 8.1 Write integration tests for credentials email flow
    - Test full registration + email service call
    - Test retry logic on provider failure
    - Test audit logging on success and failure
    - Create `signage/tests/test_register_email.py`
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

  - [x]* 8.2 Write integration tests for password reset flow
    - Test full flow: request → validate → confirm → verify new password works
    - Test expired token rejection
    - Test used token rejection
    - Test rate limiting end-to-end
    - Add to `signage/tests/test_password_reset_views.py`
    - _Requirements: 3.3, 3.6, 3.7, 4.2, 7.1, 7.2_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Backend uses Python with Django/DRF; Frontend uses JavaScript with React/MUI
- All UI text must be in Brazilian Portuguese (pt-BR)
- The `secrets` module is used for cryptographic randomness (no external dependency)
- Email templates use inline CSS for maximum email client compatibility

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.4", "3.1", "3.2", "4.1", "6.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.5", "2.6", "4.2"] },
    { "id": 2, "tasks": ["2.7", "4.3", "4.5", "4.6"] },
    { "id": 3, "tasks": ["4.4", "4.7", "4.8", "4.9"] },
    { "id": 4, "tasks": ["6.2", "6.4", "6.6", "6.7", "6.8"] },
    { "id": 5, "tasks": ["6.3", "6.5"] },
    { "id": 6, "tasks": ["8.1", "8.2"] }
  ]
}
```
