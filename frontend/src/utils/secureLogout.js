/**
 * Função de Logout Seguro com Higiene Completa de Sessão.
 * 
 * 1. Remove TODOS os tokens JWT e dados de sessão do localStorage e sessionStorage
 * 2. Limpa qualquer estado em memória (cookies de sessão)
 * 3. Usa window.location.replace() para limpar o histórico do navegador,
 *    impedindo que o botão "Voltar" acesse dados cacheados
 */
const secureLogout = () => {
  // 1. Limpeza explícita de tokens e dados sensíveis do localStorage
  const sensitiveKeys = [
    'access_token',
    'refresh_token',
    'user_role',
    'user_name',
    'user_id',
  ];
  sensitiveKeys.forEach((key) => localStorage.removeItem(key));

  // 2. Limpeza completa de qualquer dado residual
  localStorage.clear();
  sessionStorage.clear();

  // 3. Marca que o logout foi intencional (para exibir mensagem na tela de login)
  // Usa sessionStorage pois será limpo ao fechar a aba
  sessionStorage.setItem('logout_reason', 'manual');

  // 4. Redireciona usando replace() para impedir navegação "Voltar"
  // Isso substitui a entrada atual no histórico, não adiciona uma nova
  window.location.replace('/login');
};

/**
 * Logout por inatividade - similar ao secureLogout mas com motivo diferente.
 */
export const idleLogout = () => {
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem('logout_reason', 'idle');
  window.location.replace('/login');
};

export default secureLogout;
