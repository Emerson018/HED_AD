import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Snackbar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { getTheme } from '../theme';
import { ThemeProvider } from '@mui/material/styles';
import logoHed from '../assets/logo-hed.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Validation errors
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const navigate = useNavigate();

  useEffect(() => {
    const logoutReason = sessionStorage.getItem('logout_reason');
    if (logoutReason === 'idle') {
      setSnackbar({ open: true, message: 'Sessão expirada por inatividade. Faça login novamente.', severity: 'warning' });
      sessionStorage.removeItem('logout_reason');
    } else if (logoutReason === 'manual') {
      setSnackbar({ open: true, message: 'Você deslogou com sucesso.', severity: 'success' });
      sessionStorage.removeItem('logout_reason');
    }
    // Compatibilidade com logout antigo
    if (localStorage.getItem('logout_success') === 'true') {
      setSnackbar({ open: true, message: 'Você deslogou com sucesso.', severity: 'success' });
      localStorage.removeItem('logout_success');
    }
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = 'O usuário ou e-mail é obrigatório.';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Deve ter pelo menos 3 caracteres.';
    }
    
    if (!password) {
      newErrors.password = 'A senha é obrigatória.';
    } else if (password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

    setLoading(true);
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
      
      // Salvar nome do usuário
      const displayName = user.first_name 
        ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}` 
        : user.username;
      localStorage.setItem('user_name', displayName);
      localStorage.setItem('user_id', String(user.id));
      
      setSnackbar({ open: true, message: 'Login realizado com sucesso! Redirecionando...', severity: 'success' });
      
      setTimeout(() => {
        if (user.tipo_usuario === 'ADMIN_HED' || user.is_superuser || user.is_staff) {
          localStorage.setItem('user_role', 'ADMIN_HED');
          navigate('/admin');
        } else {
          localStorage.setItem('user_role', 'PARCEIRO');
          navigate('/parceiro/campanhas');
        }
      }, 1200);
    } catch (error) {
      console.error("Login error:", error);
      const msg = "Erro ao fazer login. Verifique o usuário e a senha.";
      setError(msg);
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
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
        background: 'linear-gradient(135deg, #0A192F 0%, #003B67 50%, #005A9C 100%)',
        py: 4,
        overflowY: 'auto'
      }}>
        <Container component="main" maxWidth="xs">
          <Paper 
            elevation={12} 
            sx={{ 
              p: 4.5, 
              width: '100%', 
              borderRadius: 5, 
              bgcolor: 'background.paper',
              boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4.5 }}>
              <Typography component="h1" variant="h4" fontWeight="bold" color="primary" sx={{ letterSpacing: 0.5, mb: 1 }}>
                HED Campanhas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Acesse o painel de veiculação
              </Typography>
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            <Box component="form" onSubmit={handleLogin} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Usuário ou E-mail"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors(prev => ({ ...prev, username: null }));
                }}
                error={!!errors.username}
                helperText={errors.username}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  }
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                }}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleTogglePassword} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  }
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ 
                  mt: 4, 
                  mb: 2.5, 
                  py: 1.6, 
                  fontWeight: 'bold', 
                  borderRadius: 3,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(0, 59, 103, 0.2)'
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar no Sistema'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  to="/esqueci-senha"
                  style={{ textDecoration: 'none' }}
                >
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{
                      fontWeight: 500,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Esqueci minha senha
                  </Typography>
                </Link>
              </Box>
              
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Logo HED no canto inferior direito */}
      <Box 
        component="img" 
        src={logoHed} 
        alt="Hospital Ernesto Dornelles" 
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24, 
          height: { xs: 32, sm: 40 }, 
          opacity: 0.9, 
          pointerEvents: 'none',
          zIndex: 10000 
        }} 
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', fontWeight: 'bold' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default Login;
