import { useState, useEffect, useReducer } from 'react';
import api from '../utils/api';
import { generatePassword } from '../utils/passwordGenerator';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// ─── Formatação e Validação ────────────────────────────────────────────────────

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

// ─── UserList Component ────────────────────────────────────────────────────────

const UserList = ({ onSelectUser, onNewUser }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, forceRetry] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`usuarios/?page=${page + 1}`, {
          signal: controller.signal,
        });
        if (!cancelled) {
          setUsuarios(response.data.results);
          setTotalCount(response.data.count);
        }
      } catch (err) {
        if (!cancelled && err.name !== 'CanceledError') {
          setError('Não foi possível carregar a lista de usuários.');
          setUsuarios([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, retryCount]);

  const handleRetry = () => {
    forceRetry();
  };

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert
          severity="error"
          sx={{ borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Empty state
  if (usuarios.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={onNewUser}
            sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
          >
            Novo Usuário
          </Button>
        </Box>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Typography variant="h6" color="text.secondary">
            Nenhum usuário encontrado.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={onNewUser}
          sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
        >
          Novo Usuário
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Usuário</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>E-mail</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Empresa</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>CNPJ</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Criado em</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow
                key={usuario.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => onSelectUser(usuario)}
              >
                <TableCell>{usuario.username}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{usuario.nome_empresa || '—'}</TableCell>
                <TableCell>{usuario.cnpj || '—'}</TableCell>
                <TableCell>{formatDate(usuario.criado_em)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={10}
          rowsPerPageOptions={[10]}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </TableContainer>
    </Box>
  );
};

// ─── UserForm Component (Create & Edit Mode) ───────────────────────────────────

const UserForm = ({ onBack, editUser, onSuccess }) => {
  const isEditMode = !!editUser;

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

  // Pre-fill form with editUser data when in edit mode
  useEffect(() => {
    if (editUser) {
      setFormData({
        username: editUser.username || '',
        password: '',
        email: editUser.email || '',
        nome_empresa: editUser.nome_empresa || '',
        cnpj: editUser.cnpj ? formatCNPJ(editUser.cnpj) : '',
        telefone: editUser.telefone ? formatPhone(editUser.telefone) : ''
      });
    }
  }, [editUser]);

  const handleTogglePassword = () => setShowPassword(!showPassword);
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData({ ...formData, password: newPassword });
    setShowPassword(true);
    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
  };

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'cnpj') value = formatCNPJ(value);
    else if (e.target.name === 'telefone') value = formatPhone(value);
    else if (e.target.name === 'username') value = value.toLowerCase().replace(/[^a-z0-9.,]/g, '');
    setFormData({ ...formData, [e.target.name]: value });
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: null }));
  };

  const validate = () => {
    const newErrors = {};

    // Username validation only in create mode
    if (!isEditMode) {
      if (!formData.username.trim()) newErrors.username = 'O usuário é obrigatório.';
      else if (formData.username.trim().length < 3) newErrors.username = 'Mínimo 3 caracteres.';
      else if (!/^[a-z0-9.,]+$/.test(formData.username)) newErrors.username = 'Apenas letras minúsculas, números, ponto e vírgula.';
    }

    if (!formData.email.trim()) newErrors.email = 'O e-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'E-mail inválido.';

    // Password: required in create mode, optional in edit mode (validate only if filled)
    if (!isEditMode) {
      if (!formData.password) newErrors.password = 'A senha é obrigatória.';
      else if (!passwordRequirements.every((req) => req.test(formData.password))) newErrors.password = 'A senha não atende todos os requisitos.';
    } else {
      if (formData.password && !passwordRequirements.every((req) => req.test(formData.password))) {
        newErrors.password = 'A senha não atende todos os requisitos.';
      }
    }

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
      if (isEditMode) {
        // Edit mode: PATCH /api/usuarios/:id/
        const payload = {
          email: formData.email,
          nome_empresa: formData.nome_empresa,
          cnpj: formData.cnpj.replace(/\D/g, ''),
          telefone: formData.telefone.replace(/\D/g, '')
        };
        // Only include password if non-empty
        if (formData.password) {
          payload.password = formData.password;
        }
        await api.patch(`usuarios/${editUser.id}/`, payload);
        setSnackbar({ open: true, message: 'Usuário atualizado com sucesso!', severity: 'success' });
        // Return to list after a brief delay so user sees the notification
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else onBack();
        }, 1500);
      } else {
        // Create mode: POST /api/register/
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
      }
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData && responseData.field_errors) {
        setErrors(responseData.field_errors);
        setError('Corrija os erros nos campos destacados.');
      } else if (!err.response) {
        setError('Falha na conexão com o servidor. Verifique sua rede e tente novamente.');
      } else {
        setError(responseData?.error || (isEditMode ? 'Erro ao atualizar usuário.' : 'Erro ao criar usuário.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button
        onClick={onBack}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Voltar
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditMode ? <EditIcon color="primary" /> : <PersonAddIcon color="primary" />}
            {isEditMode ? 'Editar Usuário' : 'Novo Usuário'}
          </Typography>

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
                  helperText={isEditMode ? 'Campo não editável' : (errors.username || 'Apenas letras minúsculas, números, ponto e vírgula')}
                  InputProps={{
                    readOnly: isEditMode,
                    startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>
                  }}
                  disabled={isEditMode}
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
                  label={isEditMode ? 'Nova Senha (opcional)' : 'Senha'}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required={!isEditMode}
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password || (isEditMode ? 'Deixe vazio para manter a senha atual' : '')}
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
                  Requisitos da Senha{isEditMode ? ' (aplicados apenas se preenchida)' : ''}:
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
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : (isEditMode ? <EditIcon /> : <PersonAddIcon />)}
                sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 2, mt: 1 }}
              >
                {loading
                  ? (isEditMode ? 'Salvando...' : 'Criando...')
                  : (isEditMode ? 'Salvar Alterações' : 'Criar Usuário')
                }
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─── UserDetail Component ──────────────────────────────────────────────────────

const UserDetail = ({ user, onBack, onEdit, onDelete }) => {
  const currentUserId = localStorage.getItem('user_id');
  const isOwnAccount = String(user.id) === String(currentUserId);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const displayValue = (value) => {
    if (value === null || value === undefined || value === '') return '—';
    return value;
  };

  const tipoUsuarioLabel = (tipo) => {
    switch (tipo) {
      case 'ADMIN_HED': return 'Administrador';
      case 'PARCEIRO': return 'Parceiro';
      default: return tipo || '—';
    }
  };

  const fields = [
    { label: 'Usuário', value: user.username },
    { label: 'E-mail', value: user.email },
    { label: 'Tipo de Usuário', value: tipoUsuarioLabel(user.tipo_usuario), isChip: true },
    { label: 'Empresa', value: displayValue(user.nome_empresa) },
    { label: 'CNPJ', value: displayValue(user.cnpj) },
    { label: 'Telefone', value: displayValue(user.telefone) },
    { label: 'Criado em', value: formatDate(user.criado_em) },
    { label: 'Total de Campanhas', value: user.total_campanhas != null ? user.total_campanhas : '—' },
  ];

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ mb: 2, textTransform: 'none' }}
      >
        Voltar para lista
      </Button>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Detalhes do Usuário
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={onEdit}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Editar
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
              disabled={isOwnAccount}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Excluir
            </Button>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {fields.map((field) => (
            <Grid size={{ xs: 12, sm: 6 }} key={field.label}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {field.label}
              </Typography>
              {field.isChip ? (
                <Chip
                  label={field.value}
                  color={user.tipo_usuario === 'ADMIN_HED' ? 'primary' : 'default'}
                  size="small"
                />
              ) : (
                <Typography variant="body1" fontWeight="medium">
                  {field.value}
                </Typography>
              )}
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
};

// ─── DeleteDialog Component ────────────────────────────────────────────────────

const DeleteDialog = ({ open, user, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await api.delete(`usuarios/${user.id}/`);
      onSuccess();
    } catch {
      onClose({ error: true });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const displayName = user.nome_empresa || user.username;
  const totalCampanhas = user.total_campanhas ?? 0;

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Confirmar Exclusão
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Você está prestes a excluir o usuário <strong>{displayName}</strong> ({user.username}).
        </DialogContentText>
        {totalCampanhas > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Este usuário possui <strong>{totalCampanhas} campanha{totalCampanhas > 1 ? 's' : ''}</strong> vinculada{totalCampanhas > 1 ? 's' : ''}.
            Todas as campanhas e mídias associadas serão permanentemente removidas.
          </Alert>
        )}
        <DialogContentText color="error">
          Esta ação é irreversível. Todos os dados do usuário serão permanentemente excluídos.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={() => onClose()}
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmDelete}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
          sx={{ textTransform: 'none' }}
        >
          {loading ? 'Excluindo...' : 'Excluir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── AdminUsuarios Page Component ──────────────────────────────────────────────

const AdminUsuarios = () => {
  const [mode, setMode] = useState('list');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listKey, setListKey] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleSelectUser = (usuario) => {
    setSelectedUser(usuario);
    setMode('detail');
  };

  const handleNewUser = () => {
    setMode('create');
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setMode('list');
  };

  const handleEdit = () => {
    setMode('edit');
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = (result) => {
    setDeleteDialogOpen(false);
    if (result?.error) {
      setSnackbar({
        open: true,
        message: 'Erro ao excluir usuário. Tente novamente.',
        severity: 'error'
      });
    }
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    setSnackbar({
      open: true,
      message: 'Usuário excluído com sucesso!',
      severity: 'success'
    });
    setSelectedUser(null);
    setMode('list');
    setListKey((prev) => prev + 1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PeopleIcon fontSize="large" color="primary" />
          Usuários
        </Typography>
      </Box>

      {mode === 'list' && (
        <UserList key={listKey} onSelectUser={handleSelectUser} onNewUser={handleNewUser} />
      )}

      {mode === 'create' && (
        <UserForm onBack={handleBackToList} />
      )}

      {mode === 'edit' && selectedUser && (
        <UserForm
          editUser={selectedUser}
          onBack={handleBackToList}
          onSuccess={handleBackToList}
        />
      )}

      {mode === 'detail' && selectedUser && (
        <UserDetail
          user={selectedUser}
          onBack={handleBackToList}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <DeleteDialog
        open={deleteDialogOpen}
        user={selectedUser}
        onClose={handleDeleteDialogClose}
        onSuccess={handleDeleteSuccess}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
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

export default AdminUsuarios;
