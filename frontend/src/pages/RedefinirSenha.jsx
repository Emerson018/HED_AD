import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from '../theme';
import api from '../utils/api';

const passwordRules = [
  { key: 'minLength', label: 'Mínimo de 6 caracteres', test: (pw) => pw.length >= 6 },
  { key: 'uppercase', label: 'Pelo menos uma letra maiúscula', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'lowercase', label: 'Pelo menos uma letra minúscula', test: (pw) => /[a-z]/.test(pw) },
  { key: 'digit', label: 'Pelo menos um número', test: (pw) => /\d/.test(pw) },
  { key: 'special', label: 'Pelo menos um caractere especial (!@#$%^&*)', test: (pw) => /[!@#$%^&*]/.test(pw) }
];

const RedefinirSenha = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await api.get(`password-reset/validate-token/?token=${token}`);
        if (response.data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(getTokenErrorMessage(response.data.reason));
        }
      } catch (err) {
        const reason = err.response?.data?.reason || 'invalid';
        setTokenValid(false);
        setTokenError(getTokenErrorMessage(reason));
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const getTokenErrorMessage = (reason) => {
    switch (reason) {
      case 'expired':
        return 'Este link expirou. Solicite uma nova redefinição de senha.';
      case 'used':
        return 'Este link já foi utilizado. Solicite uma nova redefinição de senha.';
      default:
        return 'Link inválido. Solicite uma nova redefinição de senha.';
    }
  };

  const validatePassword = () => {
    const newErrors = {};
    const allRulesMet = passwordRules.every((rule) => rule.test(password));

    if (!password) {
      newErrors.password = 'A nova senha é obrigatória.';
    } else if (!allRulesMet) {
      newErrors.password = 'A senha não atende todos os requisitos.';
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = 'A confirmação de senha é obrigatória.';
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = 'As senhas não coincidem.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validatePassword()) return;

    setSubmitting(true);
    try {
      await api.post('password-reset/confirm/', {
        token,
        password,
        password_confirm: passwordConfirm
      });

      setSnackbar({
        open: true,
        message: 'Senha redefinida com sucesso! Redirecionando para o login...',
        severity: 'success'
      });

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      if (err.response?.status === 429) {
        setServerError('Muitas tentativas. Aguarde antes de tentar novamente.');
      } else if (err.response?.data) {
        const data = err.response.data;
        if (data.password) {
          setServerError(Array.isArray(data.password) ? data.password.join(' ') : data.password);
        } else if (data.detail) {
          setServerError(data.detail);
        } else if (data.message) {
          setServerError(data.message);
        } else {
          setServerError('Erro ao redefinir a senha. Tente novamente.');
        }
      } else {
        setServerError('Erro de conexão. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <ThemeProvider theme={getTheme('light')}>
        <Box sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A192F 0%, #003B67 50%, #005A9C 100%)'
        }}>
          <CircularProgress sx={{ color: 'white' }} />
        </Box>
      </ThemeProvider>
    );
  }

  if (!tokenValid) {
    return (
      <ThemeProvider theme={getTheme('light')}>
        <Box sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A192F 0%, #003B67 50%, #005A9C 100%)',
          py: 4
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
                textAlign: 'center'
              }}
            >
              <Typography component="h1" variant="h4" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
                HED Campanhas
              </Typography>
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
                {tokenError}
              </Alert>
              <Button
                component={RouterLink}
                to="/esqueci-senha"
                variant="contained"
                fullWidth
                sx={{
                  py: 1.4,
                  fontWeight: 'bold',
                  borderRadius: 3,
                  textTransform: 'none'
                }}
              >
                Solicitar nova redefinição
              </Button>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

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
              boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography component="h1" variant="h4" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
                HED Campanhas
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Defina sua nova senha
              </Typography>
            </Box>

            {serverError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {serverError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Nova senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
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
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Confirmar nova senha"
                type={showPasswordConfirm ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  if (errors.passwordConfirm) setErrors((prev) => ({ ...prev, passwordConfirm: null }));
                }}
                error={!!errors.passwordConfirm}
                helperText={errors.passwordConfirm}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} edge="end">
                        {showPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />

              {/* Password requirements checklist */}
              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Requisitos da senha:
                </Typography>
                <List dense disablePadding>
                  {passwordRules.map((rule) => {
                    const met = password.length > 0 && rule.test(password);
                    return (
                      <ListItem key={rule.key} disableGutters sx={{ py: 0.2 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          {met ? (
                            <CheckCircleIcon fontSize="small" color="success" />
                          ) : (
                            <CancelIcon fontSize="small" color={password.length > 0 ? 'error' : 'disabled'} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={rule.label}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: met ? 'success.main' : password.length > 0 ? 'error.main' : 'text.secondary'
                          }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>

              {/* Confirmation match indicator */}
              {passwordConfirm.length > 0 && password !== passwordConfirm && (
                <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                  As senhas não coincidem.
                </Typography>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.6,
                  fontWeight: 'bold',
                  borderRadius: 3,
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(0, 59, 103, 0.2)'
                }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Redefinir Senha'}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>

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

export default RedefinirSenha;
