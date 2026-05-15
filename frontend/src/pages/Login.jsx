import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { getTheme } from '../theme';
import { ThemeProvider } from '@mui/material/styles';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username,
        password,
      });
      
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      const meResponse = await axios.get('http://127.0.0.1:8000/api/me/', {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });
      
      const user = meResponse.data;
      
      if (user.tipo_usuario === 'ADMIN_HED' || user.is_superuser || user.is_staff) {
        localStorage.setItem('user_role', 'ADMIN_HED');
        navigate('/admin');
      } else {
        localStorage.setItem('user_role', 'PARCEIRO');
        navigate('/parceiro');
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Erro ao fazer login. Verifique as credenciais.");
    }
  };

  return (
    <ThemeProvider theme={getTheme('light')}>
      <Box sx={{ 
        minHeight: '100vh', 
        width: '100vw',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#003B67',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}>
        <Container component="main" maxWidth="xs">
          <Paper elevation={6} sx={{ p: 4, width: '100%', borderRadius: 4, bgcolor: 'background.paper' }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography component="h1" variant="h4" fontWeight="bold" color="primary" gutterBottom>
                HED Signage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sistema de Gestão de Campanhas
              </Typography>
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Nome de Usuário"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Senha"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 'bold' }}
              >
                Entrar no Sistema
              </Button>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2">
                  Ainda não é parceiro? <Link to="/register" style={{ textDecoration: 'none', color: '#003B67', fontWeight: 'bold' }}>Cadastre-se aqui</Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default Login;
