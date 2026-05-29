import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  TextField,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CampaignIcon from '@mui/icons-material/Campaign';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EventIcon from '@mui/icons-material/Event';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import SecurityIcon from '@mui/icons-material/Security';
import SendIcon from '@mui/icons-material/Send';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog de detalhes do Log
  const [selectedLog, setSelectedLog] = useState(null);

  // Reenvio de e-mail
  const [resending, setResending] = useState(false);
  const [resendSnackbar, setResendSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('logs/');
      setLogs(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar logs de auditoria:', err);
      setError('Não foi possível carregar os logs do sistema. Certifique-se de estar autenticado como Administrador.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async (userId) => {
    setResending(true);
    try {
      const response = await api.post(`resend-credentials/${userId}/`);
      if (response.data.email_sent) {
        setResendSnackbar({ open: true, message: 'E-mail reenviado com sucesso!', severity: 'success' });
      } else {
        setResendSnackbar({ open: true, message: 'Falha ao reenviar o e-mail.', severity: 'error' });
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao reenviar e-mail.';
      setResendSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setResending(false);
    }
  };

  const getActionStyles = (action) => {
    switch (action) {
      case 'LOGIN_SUCESSO':
        return { label: 'Login Sucesso', color: 'success', variant: 'filled' };
      case 'LOGIN_FALHA':
        return { label: 'Falha de Login', color: 'error', variant: 'filled' };
      case 'CAMPANHA_CRIACAO':
        return { label: 'Criação', color: 'primary', variant: 'outlined' };
      case 'CAMPANHA_EDICAO':
        return { label: 'Edição', color: 'warning', variant: 'outlined' };
      case 'CAMPANHA_APROVACAO':
        return { label: 'Aprovação', color: 'success', variant: 'outlined' };
      case 'CAMPANHA_EXCLUSAO':
        return { label: 'Exclusão', color: 'error', variant: 'outlined' };
      case 'CAMPANHA_PAUSA':
        return { label: 'Pausa', color: 'warning', variant: 'outlined' };
      case 'CAMPANHA_EXPIRADA':
        return { label: 'Expirada', color: 'default', variant: 'filled' };
      case 'UPLOAD_VIDEO':
        return { label: 'Upload Mídia', color: 'secondary', variant: 'outlined' };
      case 'REGISTRO_PARCEIRO':
        return { label: 'Cadastro', color: 'info', variant: 'filled' };
      default:
        return { label: action, color: 'default', variant: 'outlined' };
    }
  };

  // Filtragem dos logs em memória para melhor velocidade
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.usuario_str?.toLowerCase().includes(search.toLowerCase()) ||
      log.descricao?.toLowerCase().includes(search.toLowerCase());
    
    const matchesAction = 
      actionFilter === 'ALL' || 
      log.acao === actionFilter;

    return matchesSearch && matchesAction;
  });

  // Estatísticas rápidas baseadas nos dados carregados
  const stats = {
    total: logs.length,
    successLogins: logs.filter(l => l.acao === 'LOGIN_SUCESSO').length,
    failedLogins: logs.filter(l => l.acao === 'LOGIN_FALHA').length,
    campaignCreations: logs.filter(l => l.acao === 'CAMPANHA_CRIACAO').length,
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={50} thickness={4} />
        <Typography variant="body1" color="textSecondary">
          Carregando registros de auditoria...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, bgcolor: '#fff5f5', border: '1px solid #ffcdd2', borderRadius: 4 }}>
          <Typography variant="h6" color="error" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ErrorIcon /> Erro de Acesso
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HistoryIcon fontSize="large" /> Logs do Sistema
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Auditoria completa das atividades, operações de campanhas e tentativas de autenticação do painel de Gestão de Campanhas.
        </Typography>
      </Box>

      {/* Grid de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 3, borderLeft: '5px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="textSecondary" fontWeight="bold">Total de Atividades</Typography>
                <HistoryIcon sx={{ color: 'primary.main' }} />
              </Stack>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main' }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 3, borderLeft: '5px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="textSecondary" fontWeight="bold">Logins Bem Sucedidos</Typography>
                <CheckCircleIcon sx={{ color: 'success.main' }} />
              </Stack>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'success.main' }}>
                {stats.successLogins}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 3, borderLeft: '5px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="textSecondary" fontWeight="bold">Falhas de Login</Typography>
                <ErrorIcon sx={{ color: 'error.main' }} />
              </Stack>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'error.main' }}>
                {stats.failedLogins}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ borderRadius: 3, borderLeft: '5px solid', borderColor: 'info.main' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="textSecondary" fontWeight="bold">Novas Campanhas</Typography>
                <CampaignIcon sx={{ color: 'info.main' }} />
              </Stack>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'info.main' }}>
                {stats.campaignCreations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Painel de Filtros e Tabela */}
      <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden', p: 3 }}>
        
        {/* Barra de Filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              label="Buscar por descrição ou usuário"
              placeholder="Buscar por usuário, descrição..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              variant="outlined"
              size="small"
              label="Tipo de Ação"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon color="action" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="ALL">Todas as Ações</MenuItem>
              <MenuItem value="LOGIN_SUCESSO">Login (Sucesso)</MenuItem>
              <MenuItem value="LOGIN_FALHA">Tentativa (Falha)</MenuItem>
              <MenuItem value="CAMPANHA_CRIACAO">Criação de Campanha</MenuItem>
              <MenuItem value="CAMPANHA_EDICAO">Edição de Campanha</MenuItem>
              <MenuItem value="CAMPANHA_APROVACAO">Aprovação de Campanha</MenuItem>
              <MenuItem value="CAMPANHA_EXCLUSAO">Exclusão de Campanha</MenuItem>
              <MenuItem value="CAMPANHA_PAUSA">Pausa de Campanha</MenuItem>
              <MenuItem value="CAMPANHA_EXPIRADA">Campanha Expirada</MenuItem>
              <MenuItem value="UPLOAD_VIDEO">Upload Mídia</MenuItem>
              <MenuItem value="REGISTRO_PARCEIRO">Novos Cadastros</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        {/* Tabela de Logs */}
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Data/Hora</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Usuário</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ação</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descrição da Atividade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => {
                    const chipStyle = getActionStyles(log.acao);
                    return (
                      <TableRow 
                        key={log.id} 
                        hover 
                        onClick={() => setSelectedLog(log)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:last-child td, &:last-child th': { border: 0 }
                        }}
                      >
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {new Date(log.criado_em).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {log.usuario_str}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={chipStyle.label} 
                            color={chipStyle.color} 
                            variant={chipStyle.variant} 
                            size="small"
                            sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>
                          {log.descricao}
                        </TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="textSecondary" variant="subtitle1">
                      Nenhum registro de auditoria encontrado para os filtros selecionados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginação */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`}
        />
      </Paper>

      {/* Dialog para Detalhes do Log */}
      <Dialog 
        open={Boolean(selectedLog)} 
        onClose={() => setSelectedLog(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, overflow: 'hidden' }
        }}
      >
        {selectedLog && (() => {
          const chipStyle = getActionStyles(selectedLog.acao);
          
          let accentColor = '#003B67';
          let ActionIconComponent = HistoryIcon;

          if (selectedLog.acao === 'LOGIN_SUCESSO' || selectedLog.acao === 'CAMPANHA_APROVACAO') {
            accentColor = '#2e7d32';
            ActionIconComponent = CheckCircleIcon;
          } else if (selectedLog.acao === 'LOGIN_FALHA' || selectedLog.acao === 'CAMPANHA_EXCLUSAO') {
            accentColor = '#d32f2f';
            ActionIconComponent = ErrorIcon;
          } else if (selectedLog.acao === 'CAMPANHA_EDICAO' || selectedLog.acao === 'CAMPANHA_PAUSA') {
            accentColor = '#ed6c02';
            ActionIconComponent = SecurityIcon;
          } else if (selectedLog.acao === 'CAMPANHA_CRIACAO' || selectedLog.acao === 'UPLOAD_VIDEO' || selectedLog.acao === 'REGISTRO_PARCEIRO') {
            accentColor = '#0288d1';
            ActionIconComponent = CampaignIcon;
          }

          return (
            <>
              {/* Header do Dialog */}
              <Box sx={{ bgcolor: accentColor, color: 'white', px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <ActionIconComponent sx={{ fontSize: '1.8rem' }} />
                  <Typography variant="h6" fontWeight="bold">Detalhes da Atividade</Typography>
                </Stack>
                <IconButton onClick={() => setSelectedLog(null)} size="small" sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>

              <DialogContent sx={{ p: 3 }}>
                {/* Tipo de Ação (Badge) */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={chipStyle.label} 
                    color={chipStyle.color} 
                    variant="filled" 
                    size="medium"
                    sx={{ fontWeight: 'bold', fontSize: '0.8rem', px: 1 }}
                  />
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
                    <FingerprintIcon fontSize="small" />
                    <Typography variant="body2" fontWeight="bold">ID: #{selectedLog.id}</Typography>
                  </Stack>
                </Box>

                {/* Grid de Metadados */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <AccountCircleIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">USUÁRIO AUTOR</Typography>
                        <Typography variant="body1" fontWeight="bold">{selectedLog.usuario_str}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <EventIcon sx={{ color: 'secondary.main', fontSize: '2rem' }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">DATA E HORA</Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.9rem' }}>
                          {new Date(selectedLog.criado_em).toLocaleString('pt-BR')}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Descrição Principal */}
                <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" gutterBottom sx={{ mb: 1 }}>
                  DESCRIÇÃO DA OPERAÇÃO
                </Typography>
                <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, fontWeight: 'medium' }}>
                    {selectedLog.descricao}
                  </Typography>
                </Paper>

                {/* Mensagem de Compliance */}
                <Box sx={{ mt: 3, display: 'flex', gap: 1, alignItems: 'flex-start', opacity: 0.8 }}>
                  <SecurityIcon fontSize="small" color="action" sx={{ mt: 0.2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Este log de auditoria é gravado de forma imutável pelo sistema. Ele serve para conformidade, segurança e controle operacional do painel de anúncios HED.
                  </Typography>
                </Box>
              </DialogContent>

              <DialogActions sx={{ p: 2.5, pt: 0, justifyContent: 'space-between' }}>
                {selectedLog.acao === 'REGISTRO_PARCEIRO' && selectedLog.usuario && (
                  <Button
                    onClick={() => handleResendEmail(selectedLog.usuario)}
                    variant="outlined"
                    color="primary"
                    startIcon={resending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                    disabled={resending}
                    sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
                  >
                    {resending ? 'Enviando...' : 'Reenviar E-mail'}
                  </Button>
                )}
                {selectedLog.acao !== 'REGISTRO_PARCEIRO' && <Box />}
                <Button onClick={() => setSelectedLog(null)} variant="contained" sx={{ px: 3, borderRadius: 2, fontWeight: 'bold' }}>
                  Fechar
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>

      {/* Snackbar para feedback de reenvio de e-mail */}
      <Snackbar
        open={resendSnackbar.open}
        autoHideDuration={5000}
        onClose={() => setResendSnackbar({ ...resendSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setResendSnackbar({ ...resendSnackbar, open: false })}
          severity={resendSnackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {resendSnackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SystemLogs;
