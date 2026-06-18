# Implementation Plan: EmailJS Provider

## Overview

Implementação do `EmailJSAdapter` como novo provedor de e-mail na plataforma HED AD, seguindo o padrão adapter existente. O adaptador consome a API REST do EmailJS com seleção dinâmica de template, extração de variáveis do HTML e classificação de erros para retry. O EmailJS será configurado como provedor padrão.

## Tasks

- [x] 1. Implementar EmailJSAdapter e exceção customizada
  - [x] 1.1 Criar a classe `EmailJSHTTPError` e implementar `EmailJSAdapter` em `signage/services/email_adapters.py`
    - Adicionar a classe `EmailJSHTTPError` com atributos `status_code`, `detail` e property `is_retryable`
    - Implementar `EmailJSAdapter` herdando de `EmailProviderAdapter` com construtor validando parâmetros não-vazios (`service_id`, `user_id`, `template_credentials_id`, `template_reset_id`)
    - Implementar método `_select_template_id(subject)` com lógica de prioridade: credenciais > redefinição > fallback
    - Implementar métodos `_extract_credentials_params(html_body)` e `_extract_reset_params(html_body)` usando regex patterns definidos no design
    - Implementar método `_build_template_params()` com lógica: template_params fornecido > extração por tipo > fallback HTML truncado (max 50.000 chars)
    - Implementar método `send()` com import local de `requests`, POST para API EmailJS, timeout 10s, header `Content-Type: application/json`, logging em pt-BR
    - Lançar `EmailJSHTTPError` para status >= 400, re-raise `RequestException` para erros de rede
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 7.1, 7.3_

  - [x] 1.2 Escrever property test para validação do construtor
    - **Property 1: Constructor rejects invalid parameters**
    - **Validates: Requirements 1.1, 2.1**

  - [x] 1.3 Escrever property test para seleção de template
    - **Property 5: Template selection follows priority rules**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

  - [x] 1.4 Escrever property test para truncamento de HTML
    - **Property 9: HTML fallback respects truncation limit**
    - **Validates: Requirements 3.5**

  - [x] 1.5 Escrever property test para bypass de template_params
    - **Property 8: Explicit template_params bypasses extraction**
    - **Validates: Requirements 3.4**

- [x] 2. Checkpoint - Verificar adapter isolado
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Integrar EmailJSAdapter ao EmailService
  - [x] 3.1 Atualizar `signage/services/email_service.py` para suportar EmailJS
    - Importar `EmailJSAdapter` e `EmailJSHTTPError` de `signage.services.email_adapters`
    - Adicionar `'emailjs': EmailJSAdapter` ao `PROVIDER_MAP`
    - Modificar `_get_provider()` para instanciar `EmailJSAdapter` com parâmetros específicos (`service_id`, `user_id`, `template_credentials_id`, `template_reset_id`) quando provider for `'emailjs'`, mantendo `api_key` para os demais
    - Estender `_send_with_retry()` para inspecionar `EmailJSHTTPError.is_retryable` — não fazer retry para status 400, 401, 403
    - Estender `_validate_configuration()` para validar variáveis EmailJS quando provider for `'emailjs'` (raise `ImproperlyConfigured` se DEBUG=False, ou `_skip_sending=True` se DEBUG=True)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.5, 5.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 3.2 Atualizar `hed_project/settings.py` com configurações do EmailJS
    - Alterar default de `EMAIL_PROVIDER` de `'resend'` para `'emailjs'`
    - Adicionar variáveis `EMAILJS_SERVICE_ID`, `EMAILJS_USER_ID`, `EMAILJS_TEMPLATE_CREDENTIALS_ID`, `EMAILJS_TEMPLATE_RESET_ID` lidas de `os.environ`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1_

  - [x] 3.3 Atualizar `.env.example` com variáveis do EmailJS
    - Adicionar seção com `EMAILJS_SERVICE_ID`, `EMAILJS_USER_ID`, `EMAILJS_TEMPLATE_CREDENTIALS_ID`, `EMAILJS_TEMPLATE_RESET_ID` com comentários descritivos em pt-BR
    - Atualizar comentário de `EMAIL_PROVIDER` para incluir `emailjs` como opção (e indicar que é o padrão)
    - _Requirements: 5.7, 6.1_

  - [x] 3.4 Escrever property test para rejeição de provedor inválido
    - **Property 10: Invalid provider names are rejected**
    - **Validates: Requirements 4.4, 6.3**

  - [x] 3.5 Escrever property test para detecção de configuração ausente
    - **Property 11: Missing EmailJS configuration is detected**
    - **Validates: Requirements 5.5, 5.6**

  - [x] 3.6 Escrever property test para classificação de retry
    - **Property 13: Retry classification by error type**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 4. Checkpoint - Verificar integração com EmailService
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Testes de requisição HTTP e concorrência
  - [x] 5.1 Escrever property test para formação correta da requisição API
    - **Property 2: API request is correctly formed**
    - **Validates: Requirements 1.2, 1.3, 7.3**

  - [x] 5.2 Escrever property test para tratamento de erros HTTP
    - **Property 3: HTTP error responses raise exceptions**
    - **Validates: Requirements 1.4**

  - [x] 5.3 Escrever property test para propagação de exceções de rede
    - **Property 4: Network exceptions propagate**
    - **Validates: Requirements 1.5**

  - [x] 5.4 Escrever property test para extração round-trip de variáveis
    - **Property 6: Variable extraction round-trip**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 5.5 Escrever property test para extração falha (strings vazias)
    - **Property 7: Failed extraction produces empty strings with warnings**
    - **Validates: Requirements 3.3**

  - [x] 5.6 Escrever property test para thread-safety
    - **Property 12: Thread-safe concurrent execution**
    - **Validates: Requirements 7.1, 7.2, 7.5**

- [x] 6. Testes unitários de integração end-to-end
  - [x] 6.1 Escrever testes unitários para EmailJSAdapter
    - Testar envio de e-mail de credenciais com template correto (mock `requests.post`)
    - Testar envio de e-mail de redefinição com template correto
    - Testar fallback para `template_credentials_id` quando subject não corresponde
    - Testar timeout de 10s (mock com side_effect de timeout)
    - Testar logging em pt-BR para sucesso e falha
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 2.2, 2.3, 7.3_

  - [x] 6.2 Escrever testes unitários para EmailService com EmailJS
    - Testar que `EMAIL_PROVIDER=emailjs` instancia `EmailJSAdapter` com parâmetros corretos
    - Testar backward compatibility: `EMAIL_PROVIDER=resend` continua funcionando
    - Testar default provider: `EMAIL_PROVIDER=''` usa emailjs
    - Testar `ImproperlyConfigured` para provedor inválido
    - Testar retry para 429 e 5xx, não-retry para 400/401/403
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3, 8.4_

- [x] 7. Final checkpoint - Verificar todos os testes
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All test files follow the project convention: `signage/tests_property_emailjs.py` for property tests and `signage/tests_emailjs.py` for unit tests
- All code comments and log messages must be in Brazilian Portuguese (pt-BR)
- The `requests` library must be imported locally inside `send()` (performance rule: lazy imports)
- The adapter must be thread-safe (no shared mutable state) per performance rules

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "3.2", "3.3"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.4", "3.5", "3.6"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 5, "tasks": ["6.1", "6.2"] }
  ]
}
```
