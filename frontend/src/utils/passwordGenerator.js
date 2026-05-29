/**
 * Utilitário de Geração de Senhas Aleatórias.
 *
 * Gera senhas que satisfazem a Politica_Senha da plataforma:
 * - Comprimento entre 12 e 16 caracteres (inclusive)
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 dígito
 * - Pelo menos 1 caractere especial do conjunto !@#$%^&*
 */

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SPECIAL = '!@#$%^&*';
const ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SPECIAL;

/**
 * Retorna um inteiro aleatório criptograficamente seguro entre 0 (inclusive) e max (exclusive).
 * Usa crypto.getRandomValues quando disponível.
 *
 * @param {number} max - Limite superior (exclusive)
 * @returns {number}
 */
function secureRandomInt(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

/**
 * Gera uma senha aleatória que satisfaz a Politica_Senha.
 *
 * - Comprimento aleatório entre 12 e 16 caracteres (inclusive)
 * - Garante pelo menos 1 maiúscula, 1 minúscula, 1 dígito, 1 especial
 * - Produz uma senha diferente a cada invocação
 *
 * @returns {string} Senha gerada
 */
export function generatePassword() {
  const length = 12 + secureRandomInt(5); // 12-16

  // Garante pelo menos um caractere de cada categoria obrigatória
  const mandatory = [
    UPPERCASE[secureRandomInt(UPPERCASE.length)],
    LOWERCASE[secureRandomInt(LOWERCASE.length)],
    DIGITS[secureRandomInt(DIGITS.length)],
    SPECIAL[secureRandomInt(SPECIAL.length)],
  ];

  // Preenche o restante com caracteres aleatórios do conjunto completo
  const remaining = [];
  for (let i = 0; i < length - mandatory.length; i++) {
    remaining.push(ALL_CHARS[secureRandomInt(ALL_CHARS.length)]);
  }

  // Combina e embaralha (Fisher-Yates) para evitar posições previsíveis
  const chars = [...mandatory, ...remaining];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
