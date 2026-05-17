import React, { useState, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminPreview from './pages/AdminPreview';
import ParceiroDashboard from './pages/ParceiroDashboard';
import ParceiroHome from './pages/ParceiroHome';
import PlayerView from './pages/PlayerView';
import Register from './pages/Register';
import MinhasCampanhas from './pages/MinhasCampanhas';

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
          <Route path="/register" element={<Register />} />
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
            path="/parceiro" 
            element={
              <ProtectedRoute allowedRoles={['PARCEIRO']}>
                <ParceiroHome />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/parceiro/upload" 
            element={
              <ProtectedRoute allowedRoles={['PARCEIRO']}>
                <ParceiroDashboard />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
