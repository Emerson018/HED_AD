import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ParceiroDashboard from './pages/ParceiroDashboard';
import PlayerView from './pages/PlayerView';

const NotFound = () => <div style={{ padding: '2rem' }}><h2>Página não encontrada</h2></div>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/tv/player/:token" element={<PlayerView />} />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN_HED']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/parceiro/*" 
        element={
          <ProtectedRoute allowedRoles={['PARCEIRO']}>
            <ParceiroDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
