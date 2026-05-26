/**
 * Utilitários de Sanitização de Inputs (Prevenção de XSS).
 * 
 * O React já escapa strings por padrão ao renderizar via JSX ({variavel}).
 * Estas funções são para casos onde:
 * - Precisamos renderizar HTML vindo da API (dangerouslySetInnerHTML)
 * - Queremos validação extra nos inputs antes de enviar ao backend
 */

/**
 * Remove tags HTML e scripts de uma string.
 * Uso: sanitizar inputs de texto antes de enviar ao backend.
 * 
 * @param {string} input - String potencialmente perigosa
 * @returns {string} String limpa sem tags HTML
 */
export const stripHtml = (input) => {
  if (!input || typeof input !== 'string') return '';
  // Remove todas as tags HTML
  return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * Valida o nome da campanha de forma estrita.
 * Permite apenas: letras, números, espaços, hífens, pontos e acentos.
 * Bloqueia: <script>, tags HTML, caracteres de controle.
 * 
 * @param {string} name - Nome da campanha
 * @returns {{ valid: boolean, sanitized: string, error?: string }}
 */
export const validateCampaignName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, sanitized: '', error: 'Nome é obrigatório.' };
  }

  // Remove espaços extras
  const trimmed = name.trim();

  // Verifica tentativa de injeção de script
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,       // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, sanitized: stripHtml(trimmed), error: 'Conteúdo não permitido detectado.' };
    }
  }

  // Permite apenas caracteres seguros (letras com acento, números, espaços, hífens, pontos)
  const safePattern = /^[\p{L}\p{N}\s\-.,!?()]+$/u;
  if (!safePattern.test(trimmed)) {
    return { valid: false, sanitized: trimmed.replace(/[^\p{L}\p{N}\s\-.,!?()]/gu, ''), error: 'Caracteres especiais não permitidos.' };
  }

  if (trimmed.length > 20) {
    return { valid: false, sanitized: trimmed.slice(0, 20), error: 'Máximo 20 caracteres.' };
  }

  return { valid: true, sanitized: trimmed };
};

/**
 * Exemplo de uso com DOMPurify (caso precise renderizar HTML da API no futuro):
 * 
 * 1. Instale: npm install dompurify
 * 
 * 2. Uso:
 *    import DOMPurify from 'dompurify';
 * 
 *    const htmlDaApi = '<p>Texto <script>alert("xss")</script> seguro</p>';
 *    const htmlLimpo = DOMPurify.sanitize(htmlDaApi);
 * 
 *    // No componente React:
 *    <div dangerouslySetInnerHTML={{ __html: htmlLimpo }} />
 * 
 * O DOMPurify remove automaticamente:
 * - Tags <script>
 * - Event handlers (onclick, onerror, etc.)
 * - URLs javascript:
 * - Iframes maliciosos
 * - Qualquer vetor de XSS conhecido
 */
