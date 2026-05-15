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
  Tooltip
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
import { useNavigate } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';

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

  const [diasSemana, setDiasSemana] = useState("[1, 2, 3, 4, 5]");
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('18:00');
  const [duracao, setDuracao] = useState('15');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const campResponse = await api.get('campanhas/');
      const campData = campResponse.data;
      setCampanhas(campData);

      // Em um cenário real, poderíamos ter um endpoint de stats, mas vamos calcular aqui
      setStats({
        total: campData.length,
        pendentes: campData.filter(c => c.status === 'EM_ANALISE').length,
        ativas: campData.filter(c => c.status === 'APROVADA' || c.status === 'ATIVA').length,
        parceiros: new Set(campData.map(c => c.parceiro)).size // Simplificação
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


  const handleOpenAprovacao = (campanha) => {
    setSelectedCampanha(campanha);
    setModalOpen(true);
  };

  const handleAprovar = async (e) => {
    try {
      // O backend já valida os 300s no clean() do model ao mudar para APROVADA
      await api.patch(`campanhas/${selectedCampanha.id}/`, {
        status: 'APROVADA'
      });

      // Também criamos um agendamento padrão se necessário (opcional conforme regras novas)
      await api.post('agendamentos/', {
        campanha: selectedCampanha.id,
        dias_semana: JSON.parse(diasSemana),
        horario_inicio: horaInicio,
        horario_fim: horaFim,
        duracao_segundos: parseInt(duracao),
      });

      setModalOpen(false);
      fetchData();
      alert('Campanha aprovada e agendada!');
    } catch (error) {
      console.error("Erro ao aprovar campanha", error);
      const msg = error.response?.data?.non_field_errors?.[0] || "Erro ao aprovar. Verifique o inventário do turno.";
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
              <Box>
                <Typography variant="h4" fontWeight="bold">{stats.total}</Typography>
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
              <Box>
                <Typography variant="h4" fontWeight="bold">{stats.pendentes}</Typography>
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
              <Box>
                <Typography variant="h4" fontWeight="bold">{stats.ativas}</Typography>
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
              <Box>
                <Typography variant="h4" fontWeight="bold">{stats.parceiros}</Typography>
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
            {campanhas.map((c) => (
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
            ))}
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
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Aprovar e Agendar</DialogTitle>
        <form onSubmit={handleAprovar}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 2 }}>
                <Typography variant="caption" color="primary" fontWeight="bold">CAMPANHA</Typography>
                <Typography variant="h6">{selectedCampanha?.nome}</Typography>
              </Box>
              
              <TextField
                label="Dias da Semana (JSON)"
                fullWidth
                value={diasSemana}
                onChange={(e) => setDiasSemana(e.target.value)}
                helperText="Ex: [1, 2, 3, 4, 5] para Seg-Sex"
                variant="outlined"
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Início"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
                <TextField
                  label="Fim"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                />
              </Stack>

              <TextField
                label="Duração por Exibição (Seg)"
                type="number"
                fullWidth
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">Cancelar</Button>
            <Button type="submit" variant="contained" color="success" sx={{ px: 4, borderRadius: 2 }}>
              Aprovar Agora
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
