import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Paper, 
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { getTheme } from '../theme';
import { ThemeProvider } from '@mui/material/styles';
import logoHed from '../assets/logo-hed.png';

const formatCNPJ = (value) => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 14);
  if (cleanValue.length <= 2) return cleanValue;
  if (cleanValue.length <= 5) return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2)}`;
  if (cleanValue.length <= 8) return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5)}`;
  if (cleanValue.length <= 12) return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5, 8)}/${cleanValue.slice(8)}`;
  return `${cleanValue.slice(0, 2)}.${cleanValue.slice(2, 5)}.${cleanValue.slice(5, 8)}/${cleanValue.slice(8, 12)}-${cleanValue.slice(12, 14)}`;
};

const formatPhone = (value) => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 11);
  if (cleanValue.length <= 2) {
    return cleanValue.length > 0 ? `(${cleanValue}` : '';
  }
  if (cleanValue.length <= 6) {
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
  }
  if (cleanValue.length <= 10) {
    return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 6)}-${cleanValue.slice(6, 10)}`;
  }
  return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
};

const passwordRequirements = [
  { label: 'Mínimo de 6 caracteres', test: (pw) => pw.length >= 6 },
  { label: 'Pelo menos uma letra maiúscula', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Pelo menos uma letra minúscula', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Pelo menos um número', test: (pw) => /[0-9]/.test(pw) },
  { label: 'Pelo menos um caractere especial (!@#$...)', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) }
];

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    nome_empresa: '',
    cnpj: '',
    telefone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'cnpj') {
      value = formatCNPJ(value);
    } else if (e.target.name === 'telefone') {
      value = formatPhone(value);
    }
    setFormData({ ...formData, [e.target.name]: value });
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'O usuário é obrigatório.';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'O usuário deve ter pelo menos 3 caracteres.';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
      newErrors.username = 'Apenas letras, números, "-", "_" ou "."';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido.';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória.';
    } else {
      const allRequirementsMet = passwordRequirements.every(req => req.test(formData.password));
      if (!allRequirementsMet) {
        newErrors.password = 'A senha não atende a todos os requisitos de segurança.';
      }
    }

    // Nome Empresa validation
    if (!formData.nome_empresa.trim()) {
      newErrors.nome_empresa = 'O nome da empresa é obrigatório.';
    } else if (formData.nome_empresa.trim().length < 3) {
      newErrors.nome_empresa = 'Deve ter pelo menos 3 caracteres.';
    }

    // CNPJ validation (optional)
    if (formData.cnpj) {
      const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
      if (cleanCNPJ.length !== 14) {
        newErrors.cnpj = 'O CNPJ deve conter exatamente 14 dígitos.';
      }
    }

    // Telefone validation (optional)
    if (formData.telefone) {
      const cleanPhone = formData.telefone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        newErrors.telefone = 'DDD + 8 ou 9 dígitos.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validate()) return;

    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', formData);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData && responseData.field_errors) {
        setErrors(responseData.field_errors);
        setError('Por favor, corrija os erros nos campos destacados.');
      } else {
        setError(responseData?.error || 'Erro ao realizar cadastro. Verifique se o usuário já existe.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={getTheme('light')}>
      <Box 
        sx={{ 
          minHeight: '100vh', 
          width: '100vw',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A192F 0%, #003B67 50%, #005A9C 100%)',
          py: 4,
          overflowY: 'auto'
        }}
      >
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Paper 
            elevation={12} 
            sx={{ 
              p: 4.5, 
              borderRadius: 5, 
              bgcolor: 'background.paper',
              boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4.5 }}>
              <PersonAddIcon sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary" sx={{ letterSpacing: 0.5 }}>
                Cadastre sua Empresa
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                Seja um parceiro do Hospital Ernesto Dornelles
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                Cadastro realizado com sucesso! Redirecionando para o login...
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                
                {/* Seção 1: Acesso */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.secondary' }}>
                    Dados de Acesso
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Nome de Usuário"
                      name="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      error={!!errors.username}
                      helperText={errors.username}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                    <TextField
                      fullWidth
                      label="E-mail"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Box>
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Senha"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
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
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  
                  {/* Lista de Requisitos da Senha */}
                  <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: 'text.secondary' }}>
                      Requisitos da Senha:
                    </Typography>
                    {passwordRequirements.map((req, index) => {
                      const isMet = req.test(formData.password);
                      return (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {isMet ? (
                            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          ) : (
                            <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />
                          )}
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: isMet ? 'success.main' : 'error.main', 
                              fontWeight: 500 
                            }}
                          >
                            {req.label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Seção 2: Empresa */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: 'text.secondary' }}>
                    Dados da Empresa
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Nome da Empresa"
                      name="nome_empresa"
                      required
                      value={formData.nome_empresa}
                      onChange={handleChange}
                      error={!!errors.nome_empresa}
                      helperText={errors.nome_empresa}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                    
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <TextField
                        fullWidth
                        label="CNPJ"
                        name="cnpj"
                        placeholder="00.000.000/0001-00"
                        value={formData.cnpj}
                        onChange={handleChange}
                        error={!!errors.cnpj}
                        helperText={errors.cnpj}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                      />
                      <TextField
                        fullWidth
                        label="Telefone"
                        name="telefone"
                        placeholder="(00) 00000-0000"
                        value={formData.telefone}
                        onChange={handleChange}
                        error={!!errors.telefone}
                        helperText={errors.telefone}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                      />
                    </Box>
                  </Box>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || success}
                  sx={{ 
                    mt: 1.5,
                    py: 1.6, 
                    fontWeight: 'bold', 
                    borderRadius: 3,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(0, 59, 103, 0.2)'
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Finalizar Cadastro'}
                </Button>
              </Box>
            </form>

            <Box sx={{ mt: 3.5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Já tem uma conta?{' '}
                <Link 
                  to="/login" 
                  style={{ 
                    textDecoration: 'none', 
                    color: '#003B67', 
                    fontWeight: 700 
                  }}
                >
                  Fazer Login
                </Link>
              </Typography>
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
    </ThemeProvider>
  );
};

export default Register;
