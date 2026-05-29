import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { getTheme } from '../theme';
import { ThemeProvider } from '@mui/material/styles';
import logoHed from '../assets/logo-hed.png';
import api from '../utils/api';

const EsqueciSenha = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (value) => {
    if (!value.trim()) {
      return 'O e-mail é obrigatório.';
    }
    // Standard email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      return 'Formato de e-mail inválido.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateEmail(email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    setLoading(true);
    try {
      await api.post('password-reset/request/', { email: email.trim() });
      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Muitas tentativas. Aguarde antes de tentar novamente.');
      } else if (err.response) {
        // Any other server response — still show success to prevent enumeration
        setSuccess(true);
      } else {
        // Network error (no response)
        setError('Erro de conexão. Tente novamente.');
      }
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
                Recuperação de senha
              </Typography>
            </Box>

            {success ? (
              <Box sx={{ textAlign: 'center' }}>
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  Instruções enviadas para o e-mail informado.
                </Alert>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    mt: 1,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Voltar ao login
                </Button>
              </Box>
            ) : (
              <>
                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Informe seu e-mail cadastrado para receber as instruções de redefinição de senha.
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="E-mail"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    error={!!emailError}
                    helperText={emailError}
                    inputProps={{ maxLength: 254 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
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
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Enviar instruções'}
                  </Button>

                  <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Button
                      component={Link}
                      to="/login"
                      variant="text"
                      startIcon={<ArrowBackIcon />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        color: 'text.secondary'
                      }}
                    >
                      Voltar ao login
                    </Button>
                  </Box>
                </Box>
              </>
            )}
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
    </ThemeProvider>
  );
};

export default EsqueciSenha;
