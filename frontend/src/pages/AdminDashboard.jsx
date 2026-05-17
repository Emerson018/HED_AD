import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Stack,
  Link,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Skeleton
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
// LogoutIcon removido
import DeleteIcon from '@mui/icons-material/Delete';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TimerIcon from '@mui/icons-material/Timer';
import LinearProgress from '@mui/material/LinearProgress';
import { useNavigate } from 'react-router-dom';

const DIAS_NOMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const AdminDashboard = () => {
  const [campanhas, setCampanhas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    ativas: 0,
    parceiros: 0
  });

  const [diasSemana, setDiasSemana] = useState([1, 2, 3, 4, 5]);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');
  const [duracao, setDuracao] = useState(15);
  const [turno, setTurno] = useState('INTEGRAL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const campResponse = await api.get('campanhas/');
      const campData = campResponse.data;
      setCampanhas(campData);

      setStats({
        total: campData.length,
        pendentes: campData.filter(c => c.status === 'EM_ANALISE').length,
        ativas: campData.filter(c => c.status === 'APROVADA' || c.status === 'ATIVA').length,
        parceiros: new Set(campData.map(c => c.parceiro)).size
      });
    } catch (error) {
      console.error("Erro ao buscar dados", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOcupacao = (turnoNome) => {
    const total = campanhas
      .filter(c => (c.status === 'APROVADA' || c.status === 'ATIVA') && (c.turno === turnoNome || c.turno === 'INTEGRAL'))
      .reduce((acc, curr) => acc + (curr.duracao || 0), 0);
    return total;
  };

  const updateTimesByShift = (shift) => {
    switch (shift) {
      case 'MANHA': setHoraInicio('07:00'); setHoraFim('11:59'); break;
      case 'TARDE': setHoraInicio('12:00'); setHoraFim('17:59'); break;
      case 'NOITE': setHoraInicio('18:00'); setHoraFim('06:59'); break;
      case 'INTEGRAL': setHoraInicio('00:00'); setHoraFim('23:59'); break;
      default: break;
    }
  };

  const handleOpenAprovacao = (campanha) => {
    setSelectedCampanha(campanha);
    setDuracao(campanha.duracao || 15);
    setTurno(campanha.turno || 'INTEGRAL');
    updateTimesByShift(campanha.turno || 'INTEGRAL');
    setDiasSemana([1, 2, 3, 4, 5]);
    setModalOpen(true);
  };

  const handleAprovar = async (e) => {
    e.preventDefault();
    try {
      // 1. Salvar alteração de status, turno e duração na Campanha
      await api.patch(`campanhas/${selectedCampanha.id}/`, {
        status: 'APROVADA',
        turno: turno,
        duracao: parseInt(duracao)
      });

      // 2. Criar Agendamento detalhado
      await api.post('agendamentos/', {
        campanha: selectedCampanha.id,
        dias_semana: diasSemana,
        horario_inicio: horaInicio,
        horario_fim: horaFim,
        duracao_segundos: parseInt(duracao),
      });

      setModalOpen(false);
      fetchData();
      alert('Campanha aprovada e agendada com sucesso!');
    } catch (error) {
      console.error("Erro ao aprovar campanha", error);
      const msg = error.response?.data?.non_field_errors?.[0] || error.response?.data?.detail || "Erro ao aprovar. Verifique o inventário do turno.";
      alert(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.")) {
      try {
        await api.delete(`campanhas/${id}/`);
        fetchData();
      } catch (error) {
        console.error("Erro ao excluir", error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APROVADA': return 'success';
      case 'EM_ANALISE': return 'warning';
      case 'PAUSADA': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Painel de Gestão HED</Typography>
        <Typography variant="body2" color="textSecondary">Controle central de anúncios e campanhas</Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            borderRadius: 3,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: 10, cursor: 'pointer' }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CampaignIcon fontSize="large" />
              <Box sx={{ width: '100%' }}>
                {loading ? (
                  <Skeleton variant="text" width={50} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                ) : (
                  <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
                )}
                <Typography variant="body2">Total Campanhas</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#ed6c02', 
            color: 'white', 
            borderRadius: 3,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: 10, cursor: 'pointer' }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PendingActionsIcon fontSize="large" />
              <Box sx={{ width: '100%' }}>
                {loading ? (
                  <Skeleton variant="text" width={50} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                ) : (
                  <Typography variant="h4" fontWeight="bold">{stats.pendentes}</Typography>
                )}
                <Typography variant="body2">Pendentes</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#2e7d32', 
            color: 'white', 
            borderRadius: 3,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: 10, cursor: 'pointer' }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CheckCircleIcon fontSize="large" />
              <Box sx={{ width: '100%' }}>
                {loading ? (
                  <Skeleton variant="text" width={50} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                ) : (
                  <Typography variant="h4" fontWeight="bold">{stats.ativas}</Typography>
                )}
                <Typography variant="body2">Ativas na TV</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: '#068dbd', 
            color: 'white', 
            borderRadius: 3,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: 10, cursor: 'pointer' }
          }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PeopleIcon fontSize="large" />
              <Box sx={{ width: '100%' }}>
                {loading ? (
                  <Skeleton variant="text" width={50} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
                ) : (
                  <Typography variant="h4" fontWeight="bold">{stats.parceiros}</Typography>
                )}
                <Typography variant="body2">Parceiros Ativos</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ocupação do Inventário */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Ocupação do Carrossel (Limite 300s)</Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Manhã', key: 'MANHA', color: '#1976d2' },
          { label: 'Tarde', key: 'TARDE', color: '#ed6c02' },
          { label: 'Noite', key: 'NOITE', color: '#9c27b0' }
        ].map((t) => {
          const used = calculateOcupacao(t.key);
          const percent = Math.min((used / 300) * 100, 100);
          return (
            <Grid item xs={12} md={4} key={t.key}>
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">{t.label}</Typography>
                  <Typography variant="caption" fontWeight="bold" color={used > 300 ? 'error' : 'textSecondary'}>
                    {used}/300s
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={percent} 
                  sx={{ height: 8, borderRadius: 5, bgcolor: '#eee', '& .MuiLinearProgress-bar': { bgcolor: t.color } }} 
                />
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Campaigns Table */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Gerenciar Campanhas</Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Campanha</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Turno / Duração</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }}>Mídia</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: 'text.primary' }} align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4].map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell><Skeleton variant="text" width={20} /></TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={150} />
                    <Skeleton variant="text" width={100} />
                  </TableCell>
                  <TableCell><Skeleton variant="text" width={60} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} /></TableCell>
                  <TableCell><Skeleton variant="circular" width={24} height={24} /></TableCell>
                  <TableCell align="right"><Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 1, ml: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : (
              campanhas.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.id}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>{c.nome}</Typography>
                    <Typography variant="caption" color="textSecondary">{c.parceiro_nome || 'Parceiro desconhecido'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip label={c.turno} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                      <Typography variant="body2" fontWeight="bold">{c.duracao}s</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={c.status.replace('_', ' ')} 
                      color={getStatusColor(c.status)} 
                      size="small"
                      sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    {c.midias && c.midias.length > 0 ? (
                      <Tooltip title="Ver Mídia">
                        <IconButton size="small" href={c.midias[0].arquivo_url} target="_blank" color="primary">
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="error">Sem mídia</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                      {c.status === 'EM_ANALISE' && (
                        <Button 
                          variant="contained" 
                          color="primary" 
                          size="small"
                          onClick={() => handleOpenAprovacao(c)}
                          startIcon={<CheckCircleIcon />}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          Aprovar
                        </Button>
                      )}
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!loading && campanhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Nenhuma campanha encontrada no sistema.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Approval Dialog */}
      <Dialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        maxWidth="sm" 
        fullWidth 
        PaperProps={{ sx: { borderRadius: 4, backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', px: 3, pt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircleIcon color="success" />
            Aprovar e Agendar Campanha
          </Box>
        </DialogTitle>
        
        <form onSubmit={handleAprovar}>
          <DialogContent sx={{ px: 3 }}>
            <Stack spacing={4} sx={{ mt: 1 }}>
              
              {/* Resumo */}
              <Box sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" color="textSecondary" fontWeight="bold" sx={{ letterSpacing: 1 }}>
                  CAMPANHA SELECIONADA
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 0.5 }}>{selectedCampanha?.nome}</Typography>
                <Typography variant="body2" color="primary">{selectedCampanha?.parceiro_nome}</Typography>
              </Box>

              {/* Configuração de Turno */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    select
                    label="Turno de Exibição"
                    fullWidth
                    value={turno}
                    onChange={(e) => {
                      setTurno(e.target.value);
                      updateTimesByShift(e.target.value);
                    }}
                  >
                    <MenuItem value="INTEGRAL">Integral (24h)</MenuItem>
                    <MenuItem value="MANHA">Manhã (07h-12h)</MenuItem>
                    <MenuItem value="TARDE">Tarde (12h-18h)</MenuItem>
                    <MenuItem value="NOITE">Noite (18h-07h)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.5, bgcolor: 'action.selected', borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="textSecondary" fontWeight="bold">DURAÇÃO</Typography>
                    <Typography variant="h6" fontWeight="bold">{duracao}s</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Dias da Semana */}
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                   Dias de Veiculação
                </Typography>
                <ToggleButtonGroup
                  value={diasSemana}
                  onChange={(e, val) => val.length > 0 && setDiasSemana(val)}
                  aria-label="dias da semana"
                  fullWidth
                  sx={{ 
                    '& .MuiToggleButton-root': { 
                      borderRadius: '12px !important', 
                      mx: 0.5, 
                      border: '1px solid !important',
                      borderColor: 'divider',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }
                    } 
                  }}
                >
                  {DIAS_NOMES.map((dia, idx) => (
                    <ToggleButton key={idx} value={idx} sx={{ flex: 1 }}>
                      {dia}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {/* Horários */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Horário de Início"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Horário de Término"
                    type="time"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                  />
                </Grid>
              </Grid>

            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, bgcolor: 'action.hover' }}>
            <Button onClick={() => setModalOpen(false)} variant="text" color="inherit" sx={{ fontWeight: 'bold' }}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="success" 
              size="large"
              sx={{ px: 6, borderRadius: 3, fontWeight: 'bold', boxShadow: '0 4px 14px 0 rgba(46, 125, 50, 0.39)' }}
            >
              Aprovar Agora
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
