# Implementation Plan: Admin User Management

## Overview

Transformar a página existente "Novo Usuário" em uma seção completa de gerenciamento CRUD de usuários parceiros no painel administrativo do HED AD. A implementação segue a arquitetura existente (DRF ViewSets + React SPA com Axios), estendendo o backend com permissões, serializers e paginação, e substituindo o frontend por uma página unificada com modos (lista, criação, edição, detalhes).

## Tasks

- [x] 1. Backend: Permissões, Serializers e Paginação
  - [x] 1.1 Criar permission class `IsAdminHED` e pagination class `UsuarioPagination`
    - Adicionar `IsAdminHED` em `signage/permissions.py` que verifica `is_superuser` ou `tipo_usuario == 'ADMIN_HED'`
    - Criar `UsuarioPagination` em `signage/pagination.py` com `page_size=10`, `page_size_query_param='page_size'`, `max_page_size=50`
    - _Requirements: 7.1, 7.2, 7.3, 2.1_

  - [x] 1.2 Criar `UsuarioDetailSerializer` e `UsuarioUpdateSerializer`
    - Adicionar `UsuarioDetailSerializer` em `signage/serializers.py` com campos: `id`, `username`, `email`, `tipo_usuario`, `nome_empresa`, `cnpj`, `telefone`, `criado_em`, `total_campanhas`
    - Adicionar `UsuarioUpdateSerializer` com validação de `email`, `password` (opcional), `nome_empresa`, `cnpj`, `telefone`
    - _Requirements: 2.2, 4.2, 5.2, 5.8_

  - [x] 1.3 Adicionar novas ações de auditoria ao modelo `AuditoriaLog`
    - Adicionar `('EDICAO_USUARIO', 'Edição de Usuário')` e `('EXCLUSAO_USUARIO', 'Exclusão de Usuário')` ao `ACAO_CHOICES`
    - Gerar e aplicar migração com `python manage.py makemigrations` e `python manage.py migrate`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Backend: Refatorar `UsuarioViewSet` com CRUD completo
  - [x] 2.1 Implementar actions `list` e `retrieve` no `UsuarioViewSet`
    - Restringir `permission_classes` para `[IsAdminHED]`
    - Filtrar queryset para `tipo_usuario='PARCEIRO'` com `select_related('perfil_parceiro')`
    - Ordenar por `perfil_parceiro__criado_em` DESC
    - Usar `UsuarioPagination` e `UsuarioDetailSerializer`
    - _Requirements: 2.1, 2.2, 2.3, 4.2, 7.1_

  - [x] 2.2 Implementar action `partial_update` no `UsuarioViewSet`
    - Validar payload com `UsuarioUpdateSerializer`
    - Atualizar `Usuario.email`, `Usuario.password` (se fornecida via `set_password`), `Parceiro.nome_empresa`, `Parceiro.cnpj`, `Parceiro.telefone`
    - Verificar unicidade de email e CNPJ (excluindo o próprio usuário)
    - Registrar `AuditoriaLog` com ação `EDICAO_USUARIO` e descrição dos campos alterados
    - _Requirements: 5.4, 5.6, 5.7, 5.8, 8.2_

  - [x] 2.3 Implementar action `destroy` no `UsuarioViewSet`
    - Bloquear auto-exclusão (retornar 400 se `request.user.id == obj.id`)
    - Deletar `Usuario` (cascade remove Parceiro → Campanhas → Mídias)
    - Registrar `AuditoriaLog` com ação `EXCLUSAO_USUARIO` antes da exclusão
    - _Requirements: 6.2, 6.7, 7.5, 8.3_

  - [x] 2.4 Write property test: List endpoint returns only PARCEIRO users
    - **Property 1: List endpoint returns only PARCEIRO users, paginated and ordered**
    - **Validates: Requirements 2.1, 2.3**

  - [x] 2.5 Write property test: Permission enforcement by role
    - **Property 8: Permission enforcement by role**
    - **Validates: Requirements 7.1, 7.2, 7.3, 8.5**

- [x] 3. Backend: Atualizar `RegisterView` e validações de unicidade
  - [x] 3.1 Atualizar permissão do `RegisterView` para exigir `IsAdminHED`
    - Alterar `permission_classes` de `AllowAny` para `[IsAdminHED]`
    - Atualizar o log de auditoria para registrar o admin executor (não o usuário criado)
    - Manter rate limiting existente
    - _Requirements: 3.7, 7.1, 8.1_

  - [x] 3.2 Write property test: Input validation classifies valid/invalid inputs
    - **Property 3: Input validation correctly classifies valid and invalid inputs**
    - **Validates: Requirements 3.3, 3.4, 3.5**

  - [x] 3.3 Write property test: Uniqueness constraints reject duplicate values
    - **Property 5: Uniqueness constraints reject duplicate values**
    - **Validates: Requirements 3.9, 5.6, 5.7**

  - [x] 3.4 Write property test: Creation produces both Usuario and Parceiro
    - **Property 4: Creation produces both Usuario and Parceiro with correct data**
    - **Validates: Requirements 3.7**

- [x] 4. Checkpoint - Backend completo
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Frontend: Criar página `AdminUsuarios.jsx` com modo lista
  - [x] 5.1 Criar componente `AdminUsuarios.jsx` com estado de modos e componente `UserList`
    - Implementar estado interno `mode` (`'list' | 'create' | 'edit' | 'detail'`)
    - Implementar `UserList` com `Table` MUI: colunas username, email, nome_empresa, cnpj, criado_em (DD/MM/AAAA)
    - Implementar `TablePagination` com 10 registros por página, chamando `GET /api/usuarios/?page=N`
    - Exibir spinner durante carregamento, mensagem de erro com "Tentar novamente", e mensagem de lista vazia
    - Clique na linha abre detalhes (`setMode('detail')`)
    - Botão "Novo Usuário" no topo para `setMode('create')`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 5.2 Implementar componente `UserDetail` (modo detalhes)
    - Exibir todos os campos: username, email, tipo_usuario, nome_empresa, cnpj, telefone, criado_em, total_campanhas
    - Exibir "—" ou "não informado" para campos opcionais vazios
    - Botões "Editar" e "Excluir" visíveis simultaneamente
    - Desabilitar botão "Excluir" se o usuário alvo é o admin logado
    - Botão "Voltar" retorna à lista
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.7_

- [x] 6. Frontend: Implementar formulário de criação e edição
  - [x] 6.1 Implementar componente `UserForm` modo criação
    - Reutilizar validações e formatações (CNPJ, telefone, username, senha) do `AdminNovoUsuario.jsx` existente
    - Campos: username, email, senha (obrigatórios), nome_empresa (obrigatório), cnpj, telefone (opcionais)
    - Submissão via `POST /api/register/` com tratamento de `field_errors` inline e erros gerais em `Alert`
    - Notificação de sucesso via `Snackbar`, limpar formulário e permanecer na criação
    - Botão "Voltar" retorna à lista
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [x] 6.2 Implementar componente `UserForm` modo edição
    - Username como campo readonly
    - Preencher campos com dados atuais do usuário selecionado
    - Senha opcional (vazio = manter atual), com mesmas regras de validação quando preenchida
    - Submissão via `PATCH /api/usuarios/:id/` com tratamento de erros de unicidade (email, CNPJ)
    - Notificação de sucesso e retorno à lista com dados atualizados
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 6.3 Implementar componente `DeleteDialog`
    - Dialog MUI com nome do usuário e username
    - Exibir contagem de campanhas vinculadas e aviso de exclusão permanente
    - Botões "Cancelar" e "Excluir"
    - Chamada `DELETE /api/usuarios/:id/` na confirmação
    - Notificação de sucesso/erro via `Snackbar` com `autoHideDuration=5000`
    - Atualizar lista removendo o registro excluído
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 7. Frontend: Atualizar navegação e rotas
  - [x] 7.1 Atualizar sidebar em `Layout.jsx` e rotas em `App.jsx`
    - Renomear item "Novo Usuário" para "Usuários" com ícone `PeopleIcon` e path `/admin/usuarios`
    - Adicionar rota `/admin/usuarios` protegida com `ProtectedRoute allowedRoles={['ADMIN_HED']}`
    - Adicionar redirect de `/admin/novo-usuario` para `/admin/usuarios` via `<Navigate to="/admin/usuarios" replace />`
    - Importar `AdminUsuarios` no `App.jsx`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.7_

- [x] 8. Checkpoint - Frontend completo
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Property tests: Auditoria e cascade
  - [x] 9.1 Write property test: Update persists changes and handles optional password
    - **Property 6: Update persists changes and handles optional password**
    - **Validates: Requirements 5.4, 5.8**

  - [x] 9.2 Write property test: Cascade deletion removes all associated data
    - **Property 7: Cascade deletion removes all associated data**
    - **Validates: Requirements 6.2**

  - [x] 9.3 Write property test: Audit logging invariant
    - **Property 9: Audit logging invariant**
    - **Validates: Requirements 7.5, 8.1, 8.2, 8.3, 8.4**

  - [x] 9.4 Write property test: Serialization includes all required fields
    - **Property 2: Serialization includes all required fields**
    - **Validates: Requirements 2.2, 4.2**

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use **Hypothesis** library for Python backend testing
- The existing `AdminNovoUsuario.jsx` will be replaced by the new `AdminUsuarios.jsx` page
- The `RegisterView` permission change (3.1) means the public registration endpoint will require admin auth — ensure no other flow depends on public registration
- All UI text must be in Brazilian Portuguese (pt-BR)
- Email sending must remain asynchronous (background thread) per performance rules

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3", "3.1"] },
    { "id": 2, "tasks": ["2.4", "2.5", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["7.1"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "9.4"] }
  ]
}
```
