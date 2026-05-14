import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Lógica simplificada: Checa se o token existe no localStorage.
  // Em uma implementação real, decodificaria o JWT para pegar a role (tipo_usuario) e validar a expiração.
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role'); // Ex: 'ADMIN_HED' ou 'PARCEIRO'

  if (!token) {
    // Redireciona para o login se não estiver autenticado
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Se a rota exige uma role específica e o usuário não tem, pode mandar pra uma tela de erro ou login
    // Por enquanto, redireciona para login como fallback de segurança
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
