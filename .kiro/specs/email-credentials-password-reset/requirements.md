# Requirements Document

## Introduction

This feature adds email notification capabilities to the HED AD digital signage platform. It covers three main flows: (1) automatic email delivery of login credentials when an admin creates a new partner account, (2) random password generation in the admin's user creation form, and (3) a "forgot password" flow allowing both partners and admins to reset their password via email. The email service will be integrated into the Django backend using a configurable transactional email provider.

## Glossary

- **Sistema_Email**: The backend email service responsible for composing and sending transactional emails via a configured provider (e.g., Resend, SendGrid, Brevo).
- **Gerador_Senha**: The password generation module that produces random passwords compliant with the platform's password policy.
- **Formulario_Criacao_Usuario**: The admin-facing form (AdminNovoUsuario page) used by ADMIN_HED to create new PARCEIRO accounts.
- **Fluxo_Recuperacao_Senha**: The complete forgot-password workflow including token generation, email delivery, and password reset form.
- **ADMIN_HED**: Hospital administrator user role with full platform management permissions.
- **PARCEIRO**: Commercial partner user role that creates and manages ad campaigns.
- **Usuario**: The custom user model (signage.Usuario) extending Django's AbstractUser with tipo_usuario field.
- **Token_Redefinicao**: A time-limited, single-use cryptographic token used to authorize a password reset.
- **Politica_Senha**: The platform's password requirements — minimum 6 characters, at least one uppercase letter, one lowercase letter, one number, and one special character.

## Requirements

### Requirement 1: Send Credentials Email on Account Creation

**User Story:** As an ADMIN_HED, I want the system to automatically send an email with login credentials to a newly created PARCEIRO, so that the partner receives their access information without manual communication.

#### Acceptance Criteria

1. WHEN an ADMIN_HED successfully creates a new PARCEIRO account via the Formulario_Criacao_Usuario and the API returns a success response, THE Sistema_Email SHALL send a welcome email to the registered email address within 30 seconds, containing the username and the password defined by the ADMIN_HED during account creation.
2. WHEN the Sistema_Email sends the credentials email, THE Sistema_Email SHALL include the platform name "HED Campanhas", the login URL, the username, and the temporary password in the email body.
3. WHEN the Sistema_Email sends the credentials email, THE Sistema_Email SHALL use an HTML email template containing the HED AD logo, the platform name, and a structured layout with labeled sections for each credential field.
4. IF the Sistema_Email fails to deliver the credentials email due to an SMTP error or a sending timeout exceeding 30 seconds, THEN THE Sistema_Email SHALL log the failure in the AuditoriaLog with action type 'EMAIL_CREDENCIAIS_FALHA', display an error notification to the ADMIN_HED indicating that the email could not be sent, and preserve the successfully created account without rollback.
5. WHEN the credentials email is sent successfully, THE Sistema_Email SHALL log the event in the AuditoriaLog with action type 'EMAIL_CREDENCIAIS' including the recipient email address in the log description.
6. IF the Sistema_Email encounters a transient failure on the first sending attempt, THEN THE Sistema_Email SHALL retry sending the email up to 2 additional times with a 5-second interval between attempts before logging the failure.

### Requirement 2: Random Password Generation

**User Story:** As an ADMIN_HED, I want a button to generate a random password that meets all security requirements, so that I can quickly create secure accounts without manually composing passwords.

#### Acceptance Criteria

1. THE Formulario_Criacao_Usuario SHALL display a "Gerar Senha" button adjacent to the password field.
2. WHEN the ADMIN_HED clicks the "Gerar Senha" button, THE Gerador_Senha SHALL produce a random password that satisfies all rules defined in the Politica_Senha, with a length randomly selected between 12 and 16 characters (inclusive), containing at least one uppercase letter, one lowercase letter, one digit, and one special character from the set (!@#$%^&*).
3. WHEN the Gerador_Senha produces a password, THE Formulario_Criacao_Usuario SHALL replace the current password field value with the generated password, set the password visibility toggle to visible (show password), and update the password requirements checklist to reflect the generated password's compliance state.
4. WHEN the ADMIN_HED clicks the "Gerar Senha" button multiple consecutive times, THE Gerador_Senha SHALL produce a different password on each invocation.

### Requirement 3: Forgot Password — Request Reset

**User Story:** As a Usuario (ADMIN_HED or PARCEIRO), I want to request a password reset from the login page, so that I can regain access to my account if I forget my password.

#### Acceptance Criteria

1. THE Login page SHALL display an "Esqueci minha senha" link below the login form.
2. WHEN the Usuario clicks "Esqueci minha senha", THE system SHALL navigate to a password reset request page containing a single email input field (maximum 254 characters) and a submit button.
3. WHEN the Usuario submits a valid registered email address on the reset request page, THE Sistema_Email SHALL send a password reset email containing a unique reset link with a Token_Redefinicao, and THE system SHALL display a confirmation message indicating that instructions were sent to the provided email.
4. IF the Usuario submits an email address that does not exist in the system, THEN THE system SHALL display the same confirmation message as for a valid email to prevent email enumeration attacks.
5. IF the Usuario submits an empty or malformed email address (not matching standard email format), THEN THE system SHALL display an inline validation error indicating the email format is invalid, without making a request to the server.
6. THE Token_Redefinicao SHALL expire after 30 minutes from the time of generation.
7. THE Token_Redefinicao SHALL be single-use and become invalid after a successful password reset.
8. WHEN a new password reset is requested for an email that already has an unexpired Token_Redefinicao, THE system SHALL invalidate the previous token and generate a new one.

### Requirement 4: Forgot Password — Reset Execution

**User Story:** As a Usuario, I want to set a new password using the reset link I received by email, so that I can securely regain access to my account.

#### Acceptance Criteria

1. WHEN the Usuario opens the reset link containing a valid Token_Redefinicao, THE system SHALL display a password reset form with a new password field and a confirmation field.
2. WHEN the Usuario submits a new password that satisfies the Politica_Senha and the confirmation field matches the new password field, THE system SHALL update the Usuario's password, invalidate the Token_Redefinicao, and redirect the Usuario to the login page with a confirmation message within 3 seconds.
3. IF the submitted new password does not satisfy the Politica_Senha (minimum 6 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character), THEN THE system SHALL display inline validation messages in Brazilian Portuguese indicating each unmet rule without clearing the form fields.
4. IF the confirmation field value does not match the new password field value, THEN THE system SHALL display a validation message indicating the passwords do not match and SHALL NOT submit the form to the backend.
5. IF the Token_Redefinicao has expired (older than 30 minutes from issuance), THEN THE system SHALL display a message "Este link expirou. Solicite uma nova redefinição de senha." and provide a link back to the reset request page.
6. IF the Token_Redefinicao has already been used, THEN THE system SHALL display a message "Este link já foi utilizado. Solicite uma nova redefinição de senha." and provide a link back to the reset request page.
7. IF the Token_Redefinicao is malformed or does not exist in the system, THEN THE system SHALL display a message "Link inválido. Solicite uma nova redefinição de senha." and provide a link back to the reset request page.
8. WHEN the password is successfully reset, THE system SHALL log the event in the AuditoriaLog with action type 'SENHA_REDEFINIDA', recording the Usuario identifier and a timestamp.

### Requirement 5: Password Reset Email Content

**User Story:** As a Usuario, I want the password reset email to be clear and professional, so that I can easily identify it as legitimate and follow the instructions.

#### Acceptance Criteria

1. WHEN the Sistema_Email sends a password reset email, THE Sistema_Email SHALL include the platform name "HED Campanhas", the user's first name, and a reset link rendered as a clickable button labeled "Redefinir Senha".
2. WHEN the Sistema_Email sends a password reset email, THE Sistema_Email SHALL include a message stating the link expires in 30 minutes.
3. WHEN the Sistema_Email sends a password reset email, THE Sistema_Email SHALL include a disclaimer stating "Se você não solicitou esta redefinição, ignore este e-mail."
4. WHEN the Sistema_Email sends a password reset email, THE Sistema_Email SHALL use a subject line in Brazilian Portuguese that contains the platform name "HED Campanhas" and indicates the email purpose as password reset, with a maximum length of 78 characters.
5. THE Sistema_Email SHALL render all password reset email body content (headings, paragraphs, button labels, and footer text) in Brazilian Portuguese (pt-BR).

### Requirement 6: Email Service Configuration

**User Story:** As a developer, I want the email service to be configurable via environment variables, so that the provider can be changed without code modifications.

#### Acceptance Criteria

1. THE Sistema_Email SHALL read the email provider API key from the environment variable EMAIL_API_KEY, treating an unset or empty-string value as not configured.
2. THE Sistema_Email SHALL read the sender email address from the environment variable EMAIL_FROM_ADDRESS, treating an unset or empty-string value as not configured.
3. THE Sistema_Email SHALL read the provider identifier from the environment variable EMAIL_PROVIDER and use it to select the corresponding email adapter.
4. IF the EMAIL_API_KEY or EMAIL_FROM_ADDRESS environment variable is not configured and DEBUG=True, THEN THE Sistema_Email SHALL log a warning via Django's logging framework and skip email sending, returning without raising an exception to the caller.
5. IF the EMAIL_API_KEY or EMAIL_FROM_ADDRESS environment variable is not configured and DEBUG=False, THEN THE Sistema_Email SHALL raise a configuration error that prevents application startup.
6. IF the EMAIL_PROVIDER environment variable contains a value that does not match any supported adapter, THEN THE Sistema_Email SHALL raise a configuration error indicating the unsupported provider name.
7. IF the EMAIL_FROM_ADDRESS environment variable is configured but does not contain a valid email address format, THEN THE Sistema_Email SHALL raise a configuration error indicating the invalid sender address.

### Requirement 7: Rate Limiting for Password Reset

**User Story:** As a platform administrator, I want password reset requests to be rate-limited, so that the system is protected against abuse and email flooding.

#### Acceptance Criteria

1. THE Fluxo_Recuperacao_Senha SHALL limit password reset requests to a maximum of 3 per email address within a sliding 1-hour window.
2. THE Fluxo_Recuperacao_Senha SHALL limit password reset requests from a single IP address to a maximum of 10 within a sliding 1-hour window.
3. THE Fluxo_Recuperacao_Senha SHALL enforce both the per-email and per-IP rate limits independently, rejecting the request when either limit is exceeded.
4. IF a request exceeds either rate limit, THEN THE Fluxo_Recuperacao_Senha SHALL return HTTP status 429 with a message indicating that too many attempts were made and the user must wait before trying again, without revealing whether the email address exists in the system.
5. IF a request is rate-limited, THEN THE Fluxo_Recuperacao_Senha SHALL include a Retry-After header indicating the number of seconds remaining until the next request is allowed.
