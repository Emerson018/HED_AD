import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { generatePassword } from '../utils/passwordGenerator';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Card,
  CardContent,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
  Snackbar
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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AutorenewIcon from '@mui/icons-material/Autorenew';

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
  if (cleanValue.length <= 2) return cleanValue.length > 0 ? `(${cleanValue}` : '';
  if (cleanValue.length <= 6) return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
  if (cleanValue.length <= 10) return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 6)}-${cleanValue.slice(6, 10)}`;
  return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
};

const passwordRequirements = [
  { label: 'Mínimo de 6 caracteres', test: (pw) => pw.length >= 6 },
  { label: 'Pelo menos uma letra maiúscula', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Pelo menos uma letra minúscula', test: (pw) => /[a-z]/.test(pw) },
  { label: 'Pelo menos um número', test: (pw) => /[0-9]/.test(pw) },
  { label: 'Pelo menos um caractere especial (!@#$...)', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) }
];

const AdminNovoUsuario = () => {
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
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  const handleTogglePassword = () => setShowPassword(!showPassword);
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData({ ...formData, password: newPassword });
    setShowPassword(true);
    if (errors.password) setErrors(prev => ({ ...prev, password: null }));
  };

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'cnpj') value = formatCNPJ(value);
    else if (e.target.name === 'telefone') value = formatPhone(value);
    else if (e.target.name === 'username') value = value.toLowerCase().replace(/[^a-z0-9.,]/g, '');
    setFormData({ ...formData, [e.target.name]: value });
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'O usuário é obrigatório.';
    else if (formData.username.trim().length < 3) newErrors.username = 'Mínimo 3 caracteres.';
    else if (!/^[a-z0-9.,]+$/.test(formData.username)) newErrors.username = 'Apenas letras minúsculas, números, ponto e vírgula.';

    if (!formData.email.trim()) newErrors.email = 'O e-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'E-mail inválido.';

    if (!formData.password) newErrors.password = 'A senha é obrigatória.';
    else if (!passwordRequirements.every(req => req.test(formData.password))) newErrors.password = 'A senha não atende todos os requisitos.';

    if (!formData.nome_empresa.trim()) newErrors.nome_empresa = 'O nome da empresa é obrigatório.';
    else if (formData.nome_empresa.trim().length < 3) newErrors.nome_empresa = 'Mínimo 3 caracteres.';

    if (formData.cnpj) {
      const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
      if (cleanCNPJ.length !== 14) newErrors.cnpj = 'CNPJ deve ter 14 dígitos.';
    }
    if (formData.telefone) {
      const cleanPhone = formData.telefone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) newErrors.telefone = 'DDD + 8 ou 9 dígitos.';
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
      const response = await api.post('register/', formData);
      const emailSent = response.data?.email_sent;
      if (emailSent === true) {
        setSnackbar({ open: true, message: 'Usuário criado! E-mail de credenciais enviado.', severity: 'success' });
      } else if (emailSent === false) {
        setSnackbar({ open: true, message: 'Usuário criado! Falha ao enviar e-mail de credenciais.', severity: 'warning' });
      } else {
        setSnackbar({ open: true, message: 'Usuário criado com sucesso!', severity: 'success' });
      }
      setFormData({ username: '', password: '', email: '', nome_empresa: '', cnpj: '', telefone: '' });
      setErrors({});
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData && responseData.field_errors) {
        setErrors(responseData.field_errors);
        setError('Corrija os erros nos campos destacados.');
      } else {
        setError(responseData?.error || 'Erro ao criar usuário.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonAddIcon fontSize="large" color="primary" />
          Novo Usuário
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

              {/* Dados de Acesso */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Dados de Acesso
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="Nome de Usuário"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  error={!!errors.username}
                  helperText={errors.username || 'Apenas letras minúsculas, números, ponto e vírgula'}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment> }}
                />
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="E-mail"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment> }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  sx={{ flex: 1 }}
                  label="Senha"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleTogglePassword} edge="end">
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleGeneratePassword}
                  startIcon={<AutorenewIcon />}
                  sx={{ mt: 1, whiteSpace: 'nowrap', minWidth: 'auto' }}
                >
                  Gerar Senha
                </Button>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: 'text.secondary' }}>
                  Requisitos da Senha:
                </Typography>
                {passwordRequirements.map((req, index) => {
                  const isMet = req.test(formData.password);
                  return (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {isMet ? <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} /> : <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                      <Typography variant="caption" sx={{ color: isMet ? 'success.main' : 'error.main', fontWeight: 500 }}>
                        {req.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Dados da Empresa */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Dados da Empresa
              </Typography>
              <TextField
                fullWidth
                label="Nome da Empresa"
                name="nome_empresa"
                required
                value={formData.nome_empresa}
                onChange={handleChange}
                error={!!errors.nome_empresa}
                helperText={errors.nome_empresa}
                InputProps={{ startAdornment: <InputAdornment position="start"><BusinessIcon color="action" /></InputAdornment> }}
              />
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="CNPJ"
                  name="cnpj"
                  placeholder="00.000.000/0001-00"
                  value={formData.cnpj}
                  onChange={handleChange}
                  error={!!errors.cnpj}
                  helperText={errors.cnpj}
                  InputProps={{ startAdornment: <InputAdornment position="start"><BadgeIcon color="action" /></InputAdornment> }}
                />
                <TextField
                  sx={{ flex: 1, minWidth: 200 }}
                  label="Telefone"
                  name="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={handleChange}
                  error={!!errors.telefone}
                  helperText={errors.telefone}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment> }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2, mt: 1 }}
              >
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminNovoUsuario;
