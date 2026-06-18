import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook de Auto-Logout por Inatividade.
 * 
 * Monitora eventos de interação do usuário (mouse, teclado, touch, scroll).
 * Se nenhuma interação ocorrer dentro do tempo limite, executa o callback de logout.
 * 
 * @param {function} onIdle - Função executada quando o tempo de inatividade expira
 * @param {number} timeout - Tempo de inatividade em milissegundos (padrão: 15 minutos)
 * @param {boolean} disabled - Se true, desativa completamente o monitoramento
 */
const useIdleTimeout = (onIdle, timeout = 15 * 60 * 1000, disabled = false) => {
  const timerRef = useRef(null);
  const onIdleRef = useRef(onIdle);

  // Mantém referência atualizada do callback sem re-registrar listeners
  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!disabled) {
      timerRef.current = setTimeout(() => {
        onIdleRef.current();
      }, timeout);
    }
  }, [timeout, disabled]);

  useEffect(() => {
    if (disabled) {
      // Se desativado, limpa qualquer timer existente e não registra listeners
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const events = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    // Inicia o timer
    resetTimer();

    // Registra listeners para resetar o timer a cada interação
    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      // Cleanup: remove listeners e cancela timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, disabled]);
};

export default useIdleTimeout;
