import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import AdminDashboard from './pages/AdminDashboard';
import AdminPreview from './pages/AdminPreview';
import ParceiroDashboard from './pages/ParceiroDashboard';
import PlayerView from './pages/PlayerView';
import MinhasCampanhas from './pages/MinhasCampanhas';
import SystemLogs from './pages/SystemLogs';
import AdminCampanhaInstitucional from './pages/AdminCampanhaInstitucional';
import AdminNovoUsuario from './pages/AdminNovoUsuario';
import AdminOpcoes from './pages/AdminOpcoes';
import TermosDeUso from './pages/TermosDeUso';
import Faq from './pages/Faq';

const NotFound = () => <div style={{ padding: '2rem' }}><h2>Página não encontrada</h2></div>;

function App() {
  const [mode, setMode] = useState('light');

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout toggleTheme={toggleTheme} mode={mode}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha/:token" element={<RedefinirSenha />} />
          <Route path="/tv/player/:token" element={<PlayerView />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN_HED']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/preview" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN_HED']}>
                <AdminPreview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/logs" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN_HED']}>
                <SystemLogs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/institucional" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN_HED']}>
                <AdminCampanhaInstitucional />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/opcoes" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN_HED']}>
                <AdminOpcoes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/novo-usuario" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN_HED']}>
                <AdminNovoUsuario />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/parceiro" 
            element={<Navigate to="/parceiro/campanhas" replace />} 
          />
          <Route 
            path="/parceiro/upload" 
            element={
              <ProtectedRoute allowedRoles={['PARCEIRO']}>
                <ParceiroDashboard key="new" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/parceiro/editar/:id" 
            element={
              <ProtectedRoute allowedRoles={['PARCEIRO']}>
                <ParceiroDashboard isEdit={true} key="edit" />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/parceiro/campanhas" 
            element={
              <ProtectedRoute allowedRoles={['PARCEIRO']}>
                <MinhasCampanhas />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/editar/:id" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN_HED']}>
                <ParceiroDashboard isEdit={true} isAdmin={true} key="admin-edit" />
              </ProtectedRoute>
            } 
          />
          <Route path="/termos" element={<TermosDeUso />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
