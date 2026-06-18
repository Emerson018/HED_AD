# Requirements Document

## Introduction

Esta funcionalidade transforma a página existente "Novo Usuário" (`/admin/novo-usuario`) em uma seção completa de gerenciamento de usuários ("Usuários") no painel administrativo do HED AD. A nova seção permite ao administrador (ADMIN_HED) realizar operações CRUD completas sobre os usuários do tipo PARCEIRO: criar novos usuários, listar todos os existentes, visualizar detalhes, editar informações e excluir usuários da aplicação. A aba de navegação lateral será renomeada de "Novo Usuário" para "Usuários".

## Glossary

- **Sistema**: A plataforma HED AD (backend Django + frontend React)
- **Painel_Admin**: Interface web acessível apenas por usuários com papel ADMIN_HED
- **Página_Usuários**: Nova página unificada de gerenciamento de usuários em `/admin/usuarios`
- **Lista_Usuários**: Componente de tabela que exibe todos os usuários cadastrados
- **Formulário_Usuário**: Formulário para criação ou edição de dados de um usuário
- **API_Usuários**: Endpoints REST do backend (`/api/usuarios/`) que fornecem operações CRUD
- **Usuário_Alvo**: O usuário (PARCEIRO) sendo gerenciado pelo administrador
- **Diálogo_Confirmação**: Modal de confirmação exibido antes de ações destrutivas

## Requirements

### Requirement 1: Renomear Navegação

**User Story:** Como administrador (ADMIN_HED), quero que a aba "Novo Usuário" no menu lateral seja renomeada para "Usuários", para que o nome reflita a funcionalidade completa de gerenciamento.

#### Acceptance Criteria

1. WHILE o usuário autenticado possuir o papel ADMIN_HED, THE Painel_Admin SHALL exibir no menu lateral o item com o texto "Usuários" e não SHALL exibir nenhum item com o texto "Novo Usuário"
2. WHEN o administrador clicar no item "Usuários" no menu lateral, THE Sistema SHALL navegar para a rota `/admin/usuarios` e SHALL destacar o item como ativo na barra lateral
3. THE Painel_Admin SHALL utilizar o ícone PeopleIcon (grupo de pessoas) no item de menu "Usuários"
4. WHEN o usuário acessar a rota `/admin/novo-usuario`, THE Sistema SHALL redirecionar automaticamente para `/admin/usuarios`

### Requirement 2: Listar Usuários

**User Story:** Como administrador (ADMIN_HED), quero visualizar uma lista de todos os usuários cadastrados, para que eu possa gerenciar as contas existentes.

#### Acceptance Criteria

1. WHEN a Página_Usuários for carregada, THE Lista_Usuários SHALL exibir todos os usuários do tipo PARCEIRO cadastrados no sistema, apresentando no máximo 10 registros por página com controles de paginação para navegar entre as páginas
2. THE Lista_Usuários SHALL exibir as seguintes colunas para cada usuário: nome de usuário (campo username do Usuario), e-mail (campo email do Usuario), nome da empresa (campo nome_empresa do Parceiro), CNPJ (campo cnpj do Parceiro) e data de criação (campo criado_em do Parceiro, formatada como DD/MM/AAAA)
3. WHEN a API_Usuários retornar a lista de usuários, THE Lista_Usuários SHALL ordenar os registros por data de criação em ordem decrescente (mais recentes primeiro)
4. WHILE a requisição à API_Usuários estiver em andamento, THE Página_Usuários SHALL exibir um indicador de carregamento (spinner) no lugar da tabela dentro de no máximo 200ms após o início da requisição
5. IF a API_Usuários retornar um erro, THEN THE Página_Usuários SHALL exibir uma mensagem de erro ao administrador indicando que não foi possível carregar a lista de usuários e oferecendo uma opção para tentar novamente
6. WHEN a lista de usuários estiver vazia, THE Página_Usuários SHALL exibir uma mensagem indicando que nenhum usuário foi encontrado
7. IF um usuário sem o papel ADMIN_HED tentar acessar a Página_Usuários, THEN THE Sistema SHALL redirecionar o usuário para a página inicial do seu perfil sem exibir os dados da lista

### Requirement 3: Criar Novo Usuário

**User Story:** Como administrador (ADMIN_HED), quero criar novos usuários parceiros a partir da Página_Usuários, para que eu possa cadastrar novos parceiros comerciais.

#### Acceptance Criteria

1. WHEN o administrador clicar no botão "Novo Usuário" na Página_Usuários, THE Sistema SHALL exibir o Formulário_Usuário em modo de criação
2. THE Formulário_Usuário em modo de criação SHALL exibir os campos obrigatórios (nome de usuário, e-mail, senha, nome da empresa) e os campos opcionais (CNPJ, telefone)
3. THE Formulário_Usuário SHALL validar o nome de usuário com as seguintes regras: mínimo de 3 caracteres, apenas letras minúsculas, números, ponto e vírgula permitidos
4. THE Formulário_Usuário SHALL validar o e-mail com formato válido (contendo "@" e domínio), o CNPJ com exatamente 14 dígitos numéricos quando preenchido, e o telefone com 10 ou 11 dígitos numéricos quando preenchido
5. THE Formulário_Usuário SHALL aplicar as regras de validação de senha: mínimo 6 caracteres, pelo menos uma letra maiúscula, pelo menos uma letra minúscula, pelo menos um número e pelo menos um caractere especial
6. THE Formulário_Usuário SHALL impedir a submissão e exibir mensagem de erro no campo correspondente quando qualquer validação dos critérios 3, 4 ou 5 falhar
7. WHEN o administrador submeter o Formulário_Usuário com todos os campos válidos, THE API_Usuários SHALL criar o usuário com tipo PARCEIRO e o perfil de parceiro associado contendo nome da empresa, CNPJ e telefone
8. WHEN a criação for bem-sucedida, THE Sistema SHALL exibir uma notificação de sucesso, limpar o formulário e permanecer na página de criação
9. IF o nome de usuário, e-mail ou CNPJ já existir no sistema, THEN THE Formulário_Usuário SHALL exibir uma mensagem de erro no campo correspondente indicando que o valor já está em uso
10. IF o servidor retornar um erro não relacionado a campos específicos, THEN THE Formulário_Usuário SHALL exibir uma mensagem de erro geral acima do formulário

### Requirement 4: Visualizar Detalhes do Usuário

**User Story:** Como administrador (ADMIN_HED), quero visualizar os detalhes completos de um usuário, para que eu possa verificar as informações cadastradas.

#### Acceptance Criteria

1. WHEN o administrador clicar em um registro na Lista_Usuários, THE Sistema SHALL exibir um painel de detalhes contendo todos os campos listados no critério 2, com os dados carregados em no máximo 3 segundos
2. THE Página_Usuários SHALL exibir os seguintes dados do Usuário_Alvo: nome de usuário, e-mail, tipo de usuário e data de criação (formato dd/mm/aaaa). IF o Usuário_Alvo possuir tipo_usuario PARCEIRO, THEN THE Sistema SHALL exibir adicionalmente: nome da empresa, CNPJ e telefone
3. IF algum campo opcional do Usuário_Alvo estiver vazio ou nulo (CNPJ, telefone), THEN THE Sistema SHALL exibir um indicador textual de ausência (ex: traço ou "não informado") no lugar do valor
4. THE Página_Usuários SHALL oferecer botões de ação para editar e excluir o Usuário_Alvo a partir da visualização de detalhes, ambos visíveis simultaneamente

### Requirement 5: Editar Usuário

**User Story:** Como administrador (ADMIN_HED), quero editar as informações de um usuário existente, para que eu possa corrigir ou atualizar dados cadastrais.

#### Acceptance Criteria

1. WHEN o administrador clicar no botão "Editar" de um Usuário_Alvo, THE Sistema SHALL exibir o Formulário_Usuário preenchido com os dados atuais do Usuário_Alvo em no máximo 2 segundos
2. THE Formulário_Usuário em modo de edição SHALL permitir alterar: e-mail (obrigatório, formato válido de e-mail), nome da empresa (obrigatório, mínimo 3 caracteres, máximo 150 caracteres), CNPJ (opcional, exatamente 14 dígitos numéricos com máscara XX.XXX.XXX/XXXX-XX) e telefone (opcional, 10 ou 11 dígitos numéricos com máscara)
3. THE Formulário_Usuário em modo de edição SHALL exibir o nome de usuário como campo somente leitura (não editável)
4. WHEN o administrador submeter o Formulário_Usuário com todos os campos obrigatórios preenchidos e dentro dos limites de formato e tamanho definidos no critério 2, THE API_Usuários SHALL atualizar os dados do Usuário_Alvo e retornar resposta em no máximo 5 segundos
5. WHEN a atualização for bem-sucedida, THE Sistema SHALL exibir uma notificação de sucesso visível por pelo menos 3 segundos e retornar à Lista_Usuários exibindo os dados atualizados do Usuário_Alvo
6. IF o e-mail informado já pertencer a outro usuário, THEN THE Formulário_Usuário SHALL exibir uma mensagem de erro no campo de e-mail indicando que o e-mail já está em uso, sem limpar os demais campos do formulário
7. IF o CNPJ informado já pertencer a outro parceiro, THEN THE Formulário_Usuário SHALL exibir uma mensagem de erro no campo de CNPJ indicando que o CNPJ já está cadastrado, sem limpar os demais campos do formulário
8. WHEN o administrador preencher o campo de senha no Formulário_Usuário de edição, THE Sistema SHALL validar que a nova senha possui no mínimo 6 caracteres, pelo menos uma letra maiúscula, pelo menos uma letra minúscula, pelo menos um número e pelo menos um caractere especial; IF o campo de senha estiver vazio, THEN THE Sistema SHALL manter a senha atual do Usuário_Alvo inalterada
9. IF a API_Usuários retornar erro de servidor ou a requisição falhar por indisponibilidade de rede, THEN THE Sistema SHALL exibir uma mensagem de erro informando a falha na atualização e manter os dados preenchidos no Formulário_Usuário

### Requirement 6: Excluir Usuário

**User Story:** Como administrador (ADMIN_HED), quero excluir um usuário do sistema, para que eu possa remover contas que não são mais necessárias.

#### Acceptance Criteria

1. WHEN o administrador clicar no botão "Excluir" de um Usuário_Alvo, THE Sistema SHALL exibir o Diálogo_Confirmação com o nome completo e o username do usuário a ser excluído
2. WHEN o administrador confirmar a exclusão no Diálogo_Confirmação, THE API_Usuários SHALL remover o Usuário_Alvo, o perfil de parceiro associado, e todas as campanhas e mídias vinculadas ao parceiro (exclusão em cascata)
3. WHEN a exclusão for bem-sucedida, THE Sistema SHALL exibir uma notificação de sucesso com auto-fechamento em 5 segundos, atualizar a Lista_Usuários removendo o registro excluído, e registrar a ação no log de auditoria com o username do usuário removido
4. WHEN o administrador cancelar a exclusão no Diálogo_Confirmação, THE Sistema SHALL fechar o diálogo sem realizar alterações
5. IF o Usuário_Alvo possuir campanhas associadas, THEN THE Diálogo_Confirmação SHALL exibir a quantidade de campanhas vinculadas e informar que todas serão permanentemente removidas junto com suas mídias
6. IF a API_Usuários retornar um erro na exclusão, THEN THE Sistema SHALL exibir uma mensagem de erro com auto-fechamento em 5 segundos indicando que a operação falhou e que o usuário deve tentar novamente
7. IF o Usuário_Alvo for o próprio administrador autenticado, THEN THE Sistema SHALL desabilitar o botão "Excluir" para esse registro, impedindo a auto-exclusão

### Requirement 7: Controle de Acesso

**User Story:** Como administrador (ADMIN_HED), quero que apenas administradores possam acessar a gestão de usuários, para que parceiros não possam manipular contas.

#### Acceptance Criteria

1. THE API_Usuários SHALL restringir operações de listagem, criação, edição e exclusão de usuários exclusivamente a requisições autenticadas com papel ADMIN_HED
2. IF um usuário autenticado com papel PARCEIRO realizar uma requisição à API_Usuários, THEN THE API_Usuários SHALL retornar status HTTP 403 e uma mensagem de erro indicando permissão insuficiente, sem revelar dados de outros usuários
3. IF uma requisição não autenticada tentar acessar a API_Usuários, THEN THE API_Usuários SHALL retornar status HTTP 401 dentro de 2 segundos, sem revelar se o recurso existe
4. IF um usuário com papel PARCEIRO tentar acessar qualquer rota sob `/admin/` no frontend, THEN THE Sistema SHALL redirecionar para `/parceiro/campanhas` sem exibir conteúdo da área administrativa
5. WHEN um ADMIN_HED realizar uma operação de criação, edição ou exclusão de usuário, THEN THE Sistema SHALL registrar a ação no log de auditoria contendo o identificador do administrador, a ação executada e o timestamp

### Requirement 8: Auditoria de Ações

**User Story:** Como administrador (ADMIN_HED), quero que todas as ações de gerenciamento de usuários sejam registradas, para que eu possa rastrear alterações no sistema.

#### Acceptance Criteria

1. WHEN um usuário for criado com sucesso, THE Sistema SHALL registrar um log de auditoria com a ação "REGISTRO_PARCEIRO", o nome de usuário do administrador que executou a ação, e uma descrição contendo o username e o nome da empresa do novo usuário
2. WHEN um usuário for editado com sucesso, THE Sistema SHALL registrar um log de auditoria com a ação "EDICAO_USUARIO", o nome de usuário do administrador que executou a ação, e uma descrição contendo o username do usuário editado e os nomes dos campos alterados
3. WHEN um usuário for excluído com sucesso, THE Sistema SHALL registrar um log de auditoria com a ação "EXCLUSAO_USUARIO", o nome de usuário do administrador que executou a ação, e uma descrição contendo o username do usuário removido
4. THE Sistema SHALL armazenar cada registro de auditoria com os campos: referência ao usuário executor, nome do usuário executor (texto), tipo de ação, descrição textual e data/hora de criação gerada automaticamente
5. IF o usuário autenticado não possuir o papel ADMIN_HED, THEN THE Sistema SHALL retornar erro de permissão negada ao tentar consultar os logs de auditoria
