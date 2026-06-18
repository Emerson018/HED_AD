# Requirements Document

## Introduction

Este documento especifica os requisitos para a integração do provedor EmailJS à plataforma HED AD. O sistema atual utiliza um padrão adapter (`EmailProviderAdapter`) com suporte a Resend, SendGrid e Brevo. A nova funcionalidade adiciona um `EmailJSAdapter` que consome a API REST do EmailJS diretamente pelo backend Python, substituindo o provedor padrão sem remover os existentes. O EmailJS utiliza templates configurados no seu dashboard (não templates Django locais), exigindo um mapeamento de variáveis de contexto para `template_params`.

## Glossary

- **EmailService**: Classe principal em `signage/services/email_service.py` responsável por orquestrar o envio de e-mails com lógica de retry e abstração de provedor.
- **EmailProviderAdapter**: Classe base abstrata (ABC) em `signage/services/email_adapters.py` que define a interface `send()` para todos os adaptadores de provedor.
- **EmailJSAdapter**: Novo adaptador que implementa `EmailProviderAdapter` e consome a API REST do EmailJS.
- **PROVIDER_MAP**: Dicionário em `email_service.py` que mapeia nomes de provedores (string) para suas classes adaptadoras.
- **EmailJS_API**: Endpoint REST do EmailJS em `https://api.emailjs.com/api/v1.0/email/send`.
- **Template_Params**: Objeto JSON enviado ao EmailJS contendo as variáveis que preenchem o template configurado no dashboard do EmailJS.
- **Service_ID**: Identificador do serviço de e-mail configurado no painel do EmailJS.
- **Template_ID**: Identificador de um template específico no painel do EmailJS.
- **User_ID**: Chave pública (public key) da conta EmailJS, usada para autenticação na API REST.

## Requirements

### Requisito 1: Implementação do EmailJSAdapter

**User Story:** Como administrador do sistema, quero que o EmailJS seja integrado como provedor de e-mail via API REST, para que eu possa enviar e-mails transacionais sem depender de SDKs proprietários.

#### Critérios de Aceitação

1. THE EmailJSAdapter SHALL implementar a interface `EmailProviderAdapter` definida em `email_adapters.py`, recebendo no construtor os parâmetros `service_id`, `template_id` e `user_id` (todos strings não vazias).
2. WHEN o método `send(from_addr, to, subject, html_body)` for invocado, THE EmailJSAdapter SHALL enviar uma requisição HTTP POST para `https://api.emailjs.com/api/v1.0/email/send` utilizando a biblioteca `requests` (importada localmente dentro do método) com timeout de 10 segundos e header `Content-Type: application/json`.
3. THE EmailJSAdapter SHALL incluir no payload JSON os campos `service_id`, `template_id`, `user_id` (obtidos do construtor) e `template_params` contendo as chaves `from_addr`, `to`, `subject` e `html_body` mapeadas a partir dos parâmetros do método `send()`.
4. WHEN a API do EmailJS retornar um status HTTP maior ou igual a 400, THE EmailJSAdapter SHALL registrar o erro no logger (incluindo o código de status e os primeiros 200 caracteres do corpo da resposta) e lançar uma exceção com o código de status e detalhe da resposta.
5. WHEN ocorrer uma exceção de rede (`requests.exceptions.RequestException`), THE EmailJSAdapter SHALL registrar o erro no logger (incluindo o endereço destinatário e a descrição do erro) e relançar a exceção original.
6. WHEN o envio for bem-sucedido (status HTTP entre 200 e 399 inclusive), THE EmailJSAdapter SHALL registrar uma mensagem informativa no logger contendo o endereço destinatário e retornar `True`.

### Requisito 2: Seleção de Template por Tipo de E-mail

**User Story:** Como administrador do sistema, quero que o adaptador selecione automaticamente o template correto do EmailJS com base no tipo de e-mail sendo enviado, para que credenciais e redefinição de senha usem templates distintos.

#### Critérios de Aceitação

1. THE EmailJSAdapter SHALL aceitar em seu construtor os parâmetros `service_id`, `user_id`, `template_credentials_id` e `template_reset_id` (todos strings não vazias).
2. WHEN o assunto do e-mail contiver a palavra "Credenciais" (case-insensitive), THE EmailJSAdapter SHALL utilizar o `template_credentials_id` como `template_id` no payload.
3. WHEN o assunto do e-mail contiver a palavra "Redefinição" ou "Senha" (case-insensitive), THE EmailJSAdapter SHALL utilizar o `template_reset_id` como `template_id` no payload.
4. IF o assunto do e-mail corresponder a ambos os padrões (credenciais e redefinição), THEN THE EmailJSAdapter SHALL priorizar o template de credenciais (`template_credentials_id`).
5. IF o assunto do e-mail não corresponder a nenhum template configurado, THEN THE EmailJSAdapter SHALL utilizar o `template_credentials_id` como template padrão (fallback).

### Requisito 3: Mapeamento de Variáveis para Template Params

**User Story:** Como administrador do sistema, quero que as variáveis de contexto dos templates Django sejam mapeadas corretamente para os `template_params` do EmailJS, para que os e-mails renderizados no dashboard do EmailJS contenham as informações corretas.

#### Critérios de Aceitação

1. WHEN um e-mail de credenciais for enviado (identificado conforme regra de seleção de template do Requisito 2), THE EmailJSAdapter SHALL extrair do corpo HTML via parsing e incluir em `template_params` os valores: `platform_name`, `username`, `password` e `login_url`.
2. WHEN um e-mail de redefinição de senha for enviado (identificado conforme regra de seleção de template do Requisito 2), THE EmailJSAdapter SHALL extrair do corpo HTML via parsing e incluir em `template_params` os valores: `platform_name`, `first_name` e `reset_url`.
3. IF a extração de qualquer variável esperada do corpo HTML falhar (valor não encontrado ou vazio), THEN THE EmailJSAdapter SHALL incluir a chave correspondente em `template_params` com valor de string vazia e registrar um warning no logger indicando qual variável não foi extraída.
4. THE EmailJSAdapter SHALL aceitar um parâmetro opcional `template_params` (tipo `dict` ou `None`, padrão `None`) no método `send()` que, quando fornecido com um dicionário não-vazio, será utilizado diretamente no payload sem extração do HTML.
5. IF o parâmetro `template_params` não for fornecido ou for `None`, e o assunto não corresponder a nenhum template com variáveis mapeadas (credenciais ou redefinição), THEN THE EmailJSAdapter SHALL enviar o campo `html_body` completo (até 50.000 caracteres, truncando o excedente) como valor do parâmetro `html_content` em `template_params`, permitindo que o template do EmailJS renderize o HTML diretamente.

### Requisito 4: Registro no PROVIDER_MAP

**User Story:** Como administrador do sistema, quero que o EmailJS esteja disponível como opção no mapeamento de provedores, para que eu possa selecioná-lo via variável de ambiente.

#### Critérios de Aceitação

1. THE EmailService SHALL incluir a entrada `'emailjs': EmailJSAdapter` no dicionário `PROVIDER_MAP`, importando `EmailJSAdapter` de `signage.services.email_adapters`.
2. WHEN `EMAIL_PROVIDER` estiver configurado como `'emailjs'`, THE EmailService SHALL instanciar o `EmailJSAdapter` com os parâmetros `service_id=settings.EMAILJS_SERVICE_ID`, `user_id=settings.EMAILJS_USER_ID`, `template_credentials_id=settings.EMAILJS_TEMPLATE_CREDENTIALS_ID` e `template_reset_id=settings.EMAILJS_TEMPLATE_RESET_ID`, utilizando lógica condicional no método `_get_provider()` para diferenciar do padrão `api_key` usado pelos demais adaptadores.
3. WHEN `EMAIL_PROVIDER` estiver configurado como `'resend'`, `'sendgrid'` ou `'brevo'`, THE EmailService SHALL continuar instanciando o adaptador correspondente com o parâmetro `api_key=settings.EMAIL_API_KEY`, sem alteração no comportamento existente.
4. IF `EMAIL_PROVIDER` estiver configurado com um valor não presente no `PROVIDER_MAP`, THEN THE EmailService SHALL lançar `ImproperlyConfigured` com mensagem indicando o provedor inválido e listando os provedores disponíveis.

### Requisito 5: Configuração via Variáveis de Ambiente

**User Story:** Como administrador do sistema, quero configurar o EmailJS através de variáveis de ambiente, para que as credenciais e IDs de template sejam gerenciados de forma segura fora do código.

#### Critérios de Aceitação

1. THE EmailService SHALL ler a variável de ambiente `EMAILJS_SERVICE_ID` para obter o identificador do serviço.
2. THE EmailService SHALL ler a variável de ambiente `EMAILJS_USER_ID` para obter a chave pública (public key).
3. THE EmailService SHALL ler a variável de ambiente `EMAILJS_TEMPLATE_CREDENTIALS_ID` para obter o ID do template de credenciais.
4. THE EmailService SHALL ler a variável de ambiente `EMAILJS_TEMPLATE_RESET_ID` para obter o ID do template de redefinição de senha.
5. IF `EMAIL_PROVIDER` for `'emailjs'` e qualquer uma das variáveis `EMAILJS_SERVICE_ID`, `EMAILJS_USER_ID`, `EMAILJS_TEMPLATE_CREDENTIALS_ID` ou `EMAILJS_TEMPLATE_RESET_ID` estiver ausente (não definida, vazia ou contendo apenas espaços em branco), THEN THE EmailService SHALL lançar `ImproperlyConfigured` quando `DEBUG=False`, ou registrar um warning no logger indicando quais variáveis estão faltando e definir `_skip_sending=True` quando `DEBUG=True`.
6. THE EmailService SHALL validar as variáveis de ambiente do EmailJS durante a inicialização da instância (método `_validate_configuration`), antes de qualquer tentativa de envio.
7. THE EmailService SHALL incluir as variáveis `EMAILJS_SERVICE_ID`, `EMAILJS_USER_ID`, `EMAILJS_TEMPLATE_CREDENTIALS_ID` e `EMAILJS_TEMPLATE_RESET_ID` com comentários descritivos no arquivo `.env.example`.

### Requisito 6: Provedor Padrão

**User Story:** Como administrador do sistema, quero que o EmailJS seja o provedor padrão, para que novos deployments utilizem o EmailJS sem configuração adicional de provedor.

#### Critérios de Aceitação

1. IF a variável de ambiente `EMAIL_PROVIDER` não estiver definida ou estiver definida como string vazia, THEN THE EmailService SHALL utilizar `'emailjs'` como valor padrão para seleção do provedor.
2. WHEN `EMAIL_PROVIDER` estiver configurado como `'resend'`, `'sendgrid'` ou `'brevo'`, THE EmailService SHALL instanciar o adaptador correspondente ao valor informado, preservando o comportamento existente de cada provedor sem alteração.
3. IF `EMAIL_PROVIDER` estiver configurado com um valor diferente de `'emailjs'`, `'resend'`, `'sendgrid'` ou `'brevo'` (após normalização para minúsculas e remoção de espaços), THEN THE EmailService SHALL lançar `ImproperlyConfigured` indicando o nome do provedor não suportado e a lista de provedores disponíveis.

### Requisito 7: Compatibilidade com Envio Assíncrono

**User Story:** Como desenvolvedor, quero que o EmailJSAdapter funcione corretamente quando invocado em threads de background, para que o padrão de envio assíncrono existente continue operando sem alterações.

#### Critérios de Aceitação

1. THE EmailJSAdapter SHALL ser thread-safe, sem utilizar estado mutável compartilhado (atributos de classe ou variáveis de módulo modificados durante execução) entre chamadas ao método `send()`.
2. WHEN o método `send()` for invocado a partir de `threading.Thread(daemon=True)` conforme o padrão existente nas views Django, THE EmailJSAdapter SHALL produzir o mesmo resultado observável (retornar `True` em sucesso ou lançar exceção em falha) que quando invocado a partir da thread principal.
3. THE EmailJSAdapter SHALL configurar um timeout de 10 segundos na requisição HTTP para evitar bloqueio indefinido de threads de background.
4. IF a requisição HTTP exceder o timeout de 10 segundos, THEN THE EmailJSAdapter SHALL lançar `requests.exceptions.ConnectTimeout` ou `requests.exceptions.ReadTimeout`, permitindo que a lógica de retry do EmailService trate o erro como transiente.
5. WHEN múltiplas threads invocarem o método `send()` simultaneamente, THE EmailJSAdapter SHALL processar cada chamada de forma independente, sem que uma invocação altere o payload, o resultado ou o comportamento de outra invocação concorrente.

### Requisito 8: Tratamento de Erros e Retry

**User Story:** Como administrador do sistema, quero que falhas no envio via EmailJS sejam tratadas com a mesma lógica de retry existente, para que erros transientes sejam recuperados automaticamente.

#### Critérios de Aceitação

1. WHEN a API do EmailJS retornar erro de rede, timeout (após 10 segundos sem resposta) ou erro de servidor (status 5xx), THE EmailService SHALL aplicar a lógica de retry existente (até 2 tentativas com 1 segundo de intervalo entre elas).
2. WHEN a API do EmailJS retornar erro de autenticação (status 401 ou 403), THE EmailService SHALL classificar como erro não-recuperável e interromper as tentativas imediatamente sem aguardar o intervalo de retry.
3. WHEN a API do EmailJS retornar erro de rate limit (status 429), THE EmailService SHALL aplicar a lógica de retry existente (até 2 tentativas com 1 segundo de intervalo entre elas).
4. WHEN a API do EmailJS retornar erro de requisição inválida (status 400), THE EmailService SHALL classificar como erro não-recuperável e interromper as tentativas imediatamente.
5. IF todas as tentativas de envio falharem, THEN THE EmailService SHALL registrar no logger o endereço do destinatário, o código de status HTTP retornado (quando disponível) e o número de tentativas realizadas, e retornar `False`.
6. WHEN o envio via EmailJS for bem-sucedido (status 200), THE EmailService SHALL retornar `True` sem realizar tentativas adicionais.
