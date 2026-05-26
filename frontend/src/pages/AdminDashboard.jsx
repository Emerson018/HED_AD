import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  CardActions,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Skeleton,
  Snackbar,
  Alert
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
import HistoryIcon from '@mui/icons-material/History';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ImageIcon from '@mui/icons-material/Image';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ViewListIcon from '@mui/icons-material/ViewList';
import GridViewIcon from '@mui/icons-material/GridView';
import Pagination from '@mui/material/Pagination';

const DIAS_NOMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const TVS_OPCOES = [
  { value: 'sala_espera', label: 'Sala de Espera' },
  { value: 'recepcao', label: 'Recepção' },
  { value: 'sala_cirurgia', label: 'Sala de Cirurgia' },
  { value: 'corredor', label: 'Corredor Principal' }
];

const formatTurnosFull = (turnosList) => {
  if (!turnosList || turnosList.length === 0) return 'Nenhum';
  if (turnosList.length === 4) return 'Integral (Todos os Turnos)';
  
  const map = {
    'MANHA': 'Manhã',
    'TARDE': 'Tarde',
    'NOITE': 'Noite',
    'MADRUGADA': 'Madrugada'
  };
  
  return turnosList.map(t => map[t] || t).join(', ');
};

const renderTurnosChips = (turnosList, isBelow = false) => {
  if (!turnosList || turnosList.length === 0) {
    return (
      <Chip 
        label="Nenhum" 
        size="small" 
        variant="outlined"
        sx={{ fontSize: '0.7rem', fontWeight: 600, px: 0.5 }}
      />
    );
  }
  
  if (turnosList.length === 4) {
    return (
      <Chip 
        icon={<ScheduleIcon sx={{ fontSize: '0.85rem !important' }} />}
        label="Integral" 
        size="small" 
        variant="outlined"
        color="primary"
        sx={{ fontSize: '0.7rem', fontWeight: 700, px: 1, height: 20 }}
      />
    );
  }

  const shiftConfig = {
    'MANHA': { label: 'Manhã', icon: <WbSunnyIcon sx={{ fontSize: '0.85rem !important', color: 'inherit' }} /> },
    'TARDE': { label: 'Tarde', icon: <WbSunnyIcon sx={{ fontSize: '0.85rem !important', color: 'inherit' }} /> },
    'NOITE': { label: 'Noite', icon: <NightsStayIcon sx={{ fontSize: '0.85rem !important', color: 'inherit' }} /> },
    'MADRUGADA': { label: 'Madrugada', icon: <Brightness3Icon sx={{ fontSize: '0.85rem !important', color: 'inherit' }} /> }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: isBelow ? '100%' : 165, justifyContent: isBelow ? 'flex-start' : 'flex-end' }}>
      {turnosList.map((t) => {
        const conf = shiftConfig[t];
        if (!conf) return null;
        return (
          <Chip
            key={t}
            icon={conf.icon}
            label={conf.label}
            size="small"
            sx={(theme) => {
              const isDark = theme.palette.mode === 'dark';
              const colors = {
                'MANHA': {
                  bg: isDark ? 'rgba(255, 248, 225, 0.08)' : 'rgba(255, 248, 225, 0.7)',
                  text: isDark ? '#FFE082' : '#FF8F00',
                  border: isDark ? 'rgba(255, 224, 130, 0.3)' : '#FFE082'
                },
                'TARDE': {
                  bg: isDark ? 'rgba(224, 247, 250, 0.08)' : 'rgba(224, 247, 250, 0.7)',
                  text: isDark ? '#80DEEA' : '#00838F',
                  border: isDark ? 'rgba(128, 222, 234, 0.3)' : '#80DEEA'
                },
                'NOITE': {
                  bg: isDark ? 'rgba(237, 231, 246, 0.08)' : 'rgba(237, 231, 246, 0.7)',
                  text: isDark ? '#B39DDB' : '#6A1B9A',
                  border: isDark ? 'rgba(179, 157, 219, 0.3)' : '#B39DDB'
                },
                'MADRUGADA': {
                  bg: isDark ? 'rgba(236, 239, 241, 0.08)' : 'rgba(236, 239, 241, 0.7)',
                  text: isDark ? '#B0BEC5' : '#37474F',
                  border: isDark ? 'rgba(176, 190, 197, 0.3)' : '#B0BEC5'
                }
              };
              const c = colors[t] || { bg: 'transparent', text: 'inherit', border: 'transparent' };
              return {
                fontSize: '0.75rem',
                fontWeight: 600,
                height: 22,
                backgroundColor: c.bg,
                color: c.text,
                border: `1px solid ${c.border}`,
                '& .MuiChip-label': { px: 0.8 },
                '& .MuiChip-icon': { ml: 0.5, mr: -0.2 }
              };
            }}
            variant="outlined"
          />
        );
      })}
    </Box>
  );
};

const formatTvsList = (tvsList) => {
  if (!tvsList || tvsList.length === 0) return 'Nenhuma';
  const map = {
    'sala_espera': 'Sala de Espera',
    'recepcao': 'Recepção',
    'sala_cirurgia': 'Sala de Cirurgia',
    'corredor': 'Corredor Principal'
  };
  return tvsList.map(t => map[t] || t).join(', ');
};

const renderTvsChips = (tvsList) => {
  if (!tvsList || tvsList.length === 0) {
    return (
      <Chip 
        label="Nenhuma" 
        size="small" 
        variant="outlined"
        sx={{ fontSize: '0.7rem', fontWeight: 600, px: 0.5 }}
      />
    );
  }

  const map = {
    'sala_espera': { label: 'Sala de Espera', color: 'primary' },
    'recepcao': { label: 'Recepção', color: 'secondary' },
    'sala_cirurgia': { label: 'Sala de Cirurgia', color: 'info' },
    'corredor': { label: 'Corredor Principal', color: 'default' }
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {tvsList.map((t) => {
        const conf = map[t] || { label: t, color: 'default' };
        return (
          <Chip
            key={t}
            label={conf.label}
            size="small"
            variant="outlined"
            color={conf.color === 'default' ? 'default' : conf.color}
            sx={{ fontSize: '0.7rem', fontWeight: 600, height: 20 }}
          />
        );
      })}
    </Box>
  );
};

const getTodayPyWeekday = () => {
  const jsDay = new Date().getDay(); // 0 is Sunday, 1 is Monday...
  return jsDay === 0 ? 6 : jsDay - 1;
};

const getStatusColor = (status) => {
  switch (status) {
    case 'APROVADA': return 'success';
    case 'EM_ANALISE': return 'warning';
    case 'PAUSADA': return 'error';
    case 'EXPIRADA': return 'default';
    default: return 'default';
  }
};

const AdminDashboard = () => {
  const [campanhas, setCampanhas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campanhaToDelete, setCampanhaToDelete] = useState(null);
  const navigate = useNavigate();
  
  // Snackbar notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    ativas: 0,
    parceiros: 0,
    expiradas: 0
  });

  const [diasSemana, setDiasSemana] = useState([1, 2, 3, 4, 5]);
  const [duracao, setDuracao] = useState(15);
  const [turnos, setTurnos] = useState(['MANHA', 'TARDE', 'NOITE', 'MADRUGADA']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTurno, setFilterTurno] = useState('TODOS');
  const [filterDuracao, setFilterDuracao] = useState('TODAS');
  const [filterTipo, setFilterTipo] = useState('TODOS');

  // Controle de Modo de Visualização e Paginação
  const [viewMode, setViewMode] = useState('card'); // 'card' ou 'table'
  const [cardPage, setCardPage] = useState(1);
  const [tablePage, setTablePage] = useState(1);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(10);

  // Reseta a paginação ao mudar os filtros
  useEffect(() => {
    setCardPage(1);
    setTablePage(1);
  }, [searchTerm, filterTurno, filterDuracao, filterTipo]);

  // Novos estados para controle por dia da semana e TV
  const [selectedDay, setSelectedDay] = useState(getTodayPyWeekday());
  const [selectedTv, setSelectedTv] = useState('sala_espera');
  const [ocupacaoData, setOcupacaoData] = useState({
    MANHA: { vendido: 0, institucional: 0 },
    TARDE: { vendido: 0, institucional: 0 },
    NOITE: { vendido: 0, institucional: 0 },
    MADRUGADA: { vendido: 0, institucional: 0 }
  });
  const [loadingOcupacao, setLoadingOcupacao] = useState(true);

  const filteredCampanhas = useMemo(() => {
    return campanhas.filter(c => {
      const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.parceiro_nome && c.parceiro_nome.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesTurno = false;
      if (filterTurno === 'TODOS') {
        matchesTurno = true;
      } else if (filterTurno === 'INTEGRAL') {
        matchesTurno = c.turnos && (c.turnos.includes('INTEGRAL') || c.turnos.length === 4);
      } else {
        matchesTurno = c.turnos && c.turnos.includes(filterTurno);
      }
      let matchesDuracao = true;
      if (filterDuracao !== 'TODAS') {
        const dur = c.duracao || 0;
        if (filterDuracao === 'CURTA') matchesDuracao = dur <= 15;
        else if (filterDuracao === 'MEDIA') matchesDuracao = dur > 15 && dur <= 30;
        else if (filterDuracao === 'LONGA') matchesDuracao = dur > 30 && dur <= 60;
        else if (filterDuracao === 'SUPER_LONGA') matchesDuracao = dur > 60;
      }
      
      let matchesTipo = true;
      if (filterTipo !== 'TODOS') {
        if (filterTipo === 'HOSPITAL') {
          matchesTipo = c.is_institucional === true;
        } else if (filterTipo === 'EM_ANALISE') {
          matchesTipo = c.status === 'EM_ANALISE';
        } else if (filterTipo === 'APROVADA') {
          matchesTipo = c.status === 'APROVADA' || c.status === 'ATIVA';
        } else if (filterTipo === 'EXPIRADA') {
          matchesTipo = c.status === 'EXPIRADA';
        } else {
          matchesTipo = c.status === filterTipo;
        }
      }

      return matchesSearch && matchesTurno && matchesDuracao && matchesTipo;
    });
  }, [campanhas, searchTerm, filterTurno, filterDuracao, filterTipo]);

  const fetchOcupacao = async (day, tv) => {
    setLoadingOcupacao(true);
    try {
      const response = await api.get(`campanhas/ocupacao/?dia=${day}&tv=${tv}`);
      setOcupacaoData(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados de ocupação", error);
      showMessage("Não foi possível carregar a ocupação deste dia.", "error");
    } finally {
      setLoadingOcupacao(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchOcupacao(selectedDay, selectedTv);
  }, [selectedDay, selectedTv]);

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
        parceiros: new Set(campData.map(c => c.parceiro)).size,
        expiradas: campData.filter(c => c.status === 'EXPIRADA').length
      });

      // Recarrega a ocupação atualizada
      fetchOcupacao(selectedDay, selectedTv);
    } catch (error) {
      console.error("Erro ao buscar dados", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTimesByShift = (shift) => {
    switch (shift) {
      case 'MANHA': setHoraInicio('06:00'); setHoraFim('11:59'); break;
      case 'TARDE': setHoraInicio('12:00'); setHoraFim('17:59'); break;
      case 'NOITE': setHoraInicio('18:00'); setHoraFim('23:59'); break;
      case 'MADRUGADA': setHoraInicio('00:00'); setHoraFim('05:59'); break;
      case 'INTEGRAL': setHoraInicio('00:00'); setHoraFim('23:59'); break;
      default: break;
    }
  };

  const handleOpenAprovacao = useCallback((campanha) => {
    setSelectedCampanha(campanha);
    setDuracao(campanha.duracao || 15);
    setTurnos(campanha.turnos && campanha.turnos.length > 0 ? campanha.turnos : ['MANHA', 'TARDE', 'NOITE', 'MADRUGADA']);
    setDiasSemana(campanha.dias_semana && campanha.dias_semana.length > 0 ? campanha.dias_semana : [0, 1, 2, 3, 4, 5, 6]);
    setModalOpen(true);
  }, []);

  const handleAprovar = async (e) => {
    e.preventDefault();
    try {
      // 0. Excluir agendamentos anteriores para evitar duplicação/acumulação
      if (selectedCampanha.agendamentos && selectedCampanha.agendamentos.length > 0) {
        for (const ag of selectedCampanha.agendamentos) {
          try {
            await api.delete(`agendamentos/${ag.id}/`);
          } catch (delErr) {
            console.error("Erro ao deletar agendamento antigo:", delErr);
          }
        }
      }

      // 1. Salvar alteração de status, turnos, duração e dias da semana na Campanha
      await api.patch(`campanhas/${selectedCampanha.id}/`, {
        status: 'APROVADA',
        turnos: turnos,
        duracao: parseInt(duracao),
        dias_semana: diasSemana
      });

      // 2. Criar Agendamentos detalhados para cada turno selecionado
      for (const t of turnos) {
        let hStart = '00:00';
        let hEnd = '23:59';
        if (t === 'MANHA') { hStart = '06:00'; hEnd = '11:59'; }
        else if (t === 'TARDE') { hStart = '12:00'; hEnd = '17:59'; }
        else if (t === 'NOITE') { hStart = '18:00'; hEnd = '23:59'; }
        else if (t === 'MADRUGADA') { hStart = '00:00'; hEnd = '05:59'; }

        await api.post('agendamentos/', {
          campanha: selectedCampanha.id,
          dias_semana: diasSemana,
          horario_inicio: hStart,
          horario_fim: hEnd,
          duracao_segundos: parseInt(duracao),
        });
      }

      setModalOpen(false);
      fetchData();
      showMessage('Campanha aprovada e agendada com sucesso!', 'success');
    } catch (error) {
      console.error("Erro ao aprovar campanha", error);
      const msg = error.response?.data?.non_field_errors?.[0] || error.response?.data?.detail || "Erro ao aprovar. Verifique o inventário do turno.";
      showMessage(msg, 'error');
    }
  };

  const handleOpenDelete = useCallback((campanha) => {
    setCampanhaToDelete(campanha);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!campanhaToDelete) return;
    try {
      await api.delete(`campanhas/${campanhaToDelete.id}/`);
      setDeleteDialogOpen(false);
      setCampanhaToDelete(null);
      fetchData();
      showMessage("Campanha excluída com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao excluir", error);
      showMessage("Não foi possível excluir esta campanha.", "error");
    }
  };

  const kpiCards = useMemo(() => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={2.4}>
        <Card elevation={2} sx={{ 
          borderRadius: 3,
          borderLeft: '5px solid',
          borderColor: 'primary.main'
        }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="textSecondary" fontWeight="bold">Total de Campanhas</Typography>
              <CampaignIcon sx={{ color: 'primary.main' }} />
            </Stack>
            {loading ? (
              <Skeleton variant="text" width={50} height={40} />
            ) : (
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main' }}>{stats.total}</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Card elevation={2} sx={{ 
          borderRadius: 3,
          borderLeft: '5px solid',
          borderColor: 'success.main'
        }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="textSecondary" fontWeight="bold">Ativas na TV</Typography>
              <CheckCircleIcon sx={{ color: 'success.main' }} />
            </Stack>
            {loading ? (
              <Skeleton variant="text" width={50} height={40} />
            ) : (
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'success.main' }}>{stats.ativas}</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Card elevation={2} sx={{ 
          borderRadius: 3,
          borderLeft: '5px solid',
          borderColor: 'warning.main'
        }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="textSecondary" fontWeight="bold">Pendentes</Typography>
              <PendingActionsIcon sx={{ color: 'warning.main' }} />
            </Stack>
            {loading ? (
              <Skeleton variant="text" width={50} height={40} />
            ) : (
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'warning.main' }}>{stats.pendentes}</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Card elevation={2} sx={{ 
          borderRadius: 3,
          borderLeft: '5px solid',
          borderColor: 'secondary.main'
        }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="textSecondary" fontWeight="bold">Parceiros Ativos</Typography>
              <PeopleIcon sx={{ color: 'secondary.main' }} />
            </Stack>
            {loading ? (
              <Skeleton variant="text" width={50} height={40} />
            ) : (
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'secondary.main' }}>{stats.parceiros}</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={2.4}>
        <Card elevation={2} sx={{ 
          borderRadius: 3,
          borderLeft: '5px solid',
          borderColor: 'text.secondary'
        }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
              <Typography variant="body2" color="textSecondary" fontWeight="bold">Expiradas</Typography>
              <HistoryIcon sx={{ color: 'text.secondary' }} />
            </Stack>
            {loading ? (
              <Skeleton variant="text" width={50} height={40} />
            ) : (
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.secondary' }}>{stats.expiradas}</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  ), [loading, stats]);

  const filterSection = useMemo(() => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Gerenciar Campanhas</Typography>
      
      {/* Filtros de Busca */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Buscar por nome ou parceiro..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', sm: 260 }, bgcolor: 'background.paper' }}
        />
        <TextField
          select
          size="small"
          label="Tipo"
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          sx={{ width: { xs: '100%', sm: 130 }, bgcolor: 'background.paper' }}
        >
          <MenuItem value="TODOS">Todos</MenuItem>
          <MenuItem value="APROVADA">Aprovado</MenuItem>
          <MenuItem value="EM_ANALISE">Pendente</MenuItem>
          <MenuItem value="EXPIRADA">Expirada</MenuItem>
          <MenuItem value="HOSPITAL">Hospital</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Turno"
          value={filterTurno}
          onChange={(e) => setFilterTurno(e.target.value)}
          sx={{ width: { xs: '100%', sm: 130 }, bgcolor: 'background.paper' }}
        >
          <MenuItem value="TODOS">Todos</MenuItem>
          <MenuItem value="INTEGRAL">Integral</MenuItem>
          <MenuItem value="MANHA">Manhã</MenuItem>
          <MenuItem value="TARDE">Tarde</MenuItem>
          <MenuItem value="NOITE">Noite</MenuItem>
          <MenuItem value="MADRUGADA">Madrugada</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Duração"
          value={filterDuracao}
          onChange={(e) => setFilterDuracao(e.target.value)}
          sx={{ width: { xs: '100%', sm: 110 }, bgcolor: 'background.paper' }}
        >
          <MenuItem value="TODAS">Todas</MenuItem>
          <MenuItem value="CURTA">Até 15s</MenuItem>
          <MenuItem value="MEDIA">16s a 30s</MenuItem>
          <MenuItem value="LONGA">31s a 60s</MenuItem>
          <MenuItem value="SUPER_LONGA">Acima de 60s</MenuItem>
        </TextField>
        
        <Button 
          variant="outlined" 
          color="inherit"
          onClick={() => {
            setSearchTerm('');
            setFilterTipo('TODOS');
            setFilterTurno('TODOS');
            setFilterDuracao('TODAS');
          }}
          disabled={!searchTerm && filterTipo === 'TODOS' && filterTurno === 'TODOS' && filterDuracao === 'TODAS'}
          sx={{ borderRadius: 2, textTransform: 'none', height: 40 }}
        >
          Limpar Filtros
        </Button>

        {/* Alternador de Modo de Visualização */}
        <Box sx={{ ml: { xs: 0, sm: 'auto' } }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, nextMode) => {
              if (nextMode !== null) setViewMode(nextMode);
            }}
            size="small"
            sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
          >
            <ToggleButton value="card" aria-label="cards" title="Visualização em Cards" sx={{ px: 2 }}>
              <GridViewIcon fontSize="small" sx={{ mr: 0.5 }} />
              Cards
            </ToggleButton>
            <ToggleButton value="table" aria-label="tabela" title="Visualização em Tabela" sx={{ px: 2 }}>
              <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
              Tabela
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
    </Box>
  ), [searchTerm, filterTipo, filterTurno, filterDuracao, viewMode]);

  const campaignGrid = useMemo(() => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card sx={{ borderRadius: 3, p: 1 }}>
                <CardContent>
                  <Skeleton variant="text" width="40%" height={24} />
                  <Skeleton variant="text" width="80%" height={32} sx={{ mt: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 2, borderRadius: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (filteredCampanhas.length === 0) {
      return (
        <Card sx={{ borderRadius: 3, p: 6, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" color="text.secondary">
            Nenhuma campanha corresponde aos filtros selecionados.
          </Typography>
        </Card>
      );
    }

    if (viewMode === 'card') {
      const totalCardPages = Math.ceil(filteredCampanhas.length / 8);
      const paginatedCards = filteredCampanhas.slice((cardPage - 1) * 8, cardPage * 8);

      return (
        <Box>
          <Grid container spacing={3}>
            {paginatedCards.map((c) => {
              const hasVideo = c.midias && c.midias.length > 0 && c.midias[0].tipo === 'VIDEO';
              const mediaUrl = c.midias && c.midias.length > 0 ? c.midias[0].arquivo_url : null;
              return (
                <Grid item xs={12} md={6} key={c.id} sx={{ display: 'flex' }}>
                  <Card 
                    onClick={() => navigate(`/admin/editar/${c.id}`)}
                    sx={{ 
                      borderRadius: 4,
                      width: '100%',
                      height: '100%',
                      minHeight: 370,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
                        borderColor: 'primary.main',
                        '& .edit-badge': {
                          opacity: 1,
                          transform: 'scale(1)'
                        }
                      }
                    }}
                  >
                    {/* Hover Edit Overlay/Badge */}
                    <Box 
                      className="edit-badge"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        p: 0.8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transform: 'scale(0.8)',
                        transition: 'all 0.2s ease-in-out',
                        zIndex: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </Box>

                    <CardContent sx={{ p: 3, pb: 1 }}>
                      {/* Header: Turn and Status */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Chip 
                              label={c.status === 'EM_ANALISE' ? 'PENDENTE' : c.status.replace('_', ' ')} 
                              color={getStatusColor(c.status)} 
                              size="small"
                              sx={{ fontWeight: 'bold', fontSize: '0.7rem', px: 1 }}
                            />
                            {c.is_institucional && (
                              <Tooltip title="Vídeo Institucional / Hospital" arrow>
                                <LocalHospitalIcon color="primary" sx={{ fontSize: '1.2rem', ml: 0.5 }} />
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                        {c.turnos && c.turnos.length > 0 && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <Tooltip title={`Turnos: ${formatTurnosFull(c.turnos)}`} arrow>
                              <Box>
                                {renderTurnosChips(c.turnos, true)}
                              </Box>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>

                      {/* Title */}
                      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ lineHeight: 1.3 }}>
                        {c.nome}
                      </Typography>

                      {/* Partner Name */}
                      <Typography variant="body2" color="primary.main" fontWeight={600} sx={{ mb: 1 }}>
                        {c.parceiro_nome || 'Parceiro desconhecido'}
                      </Typography>

                      {/* Category */}
                      {c.categoria && (
                        <Typography variant="caption" color="textSecondary" sx={{ bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block', mb: 2 }}>
                          {c.categoria}
                        </Typography>
                      )}

                      {/* Details: Dates, Duration, Media Type */}
                      <Stack spacing={1.5} sx={{ mt: c.categoria ? 0 : 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <CalendarTodayIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {new Date(c.data_inicio).toLocaleDateString()} - {new Date(c.data_fim).toLocaleDateString()}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          <AccessTimeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            Duração: <strong>{c.duracao} segundos</strong>
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                          {hasVideo ? <PlayArrowIcon sx={{ fontSize: 16, color: 'primary.main' }} /> : <ImageIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
                          <Typography variant="body2" sx={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            Mídia: {hasVideo ? 'Vídeo' : 'Imagem'}
                            {mediaUrl && (
                              <IconButton 
                                size="small" 
                                href={mediaUrl} 
                                target="_blank" 
                                onClick={(e) => e.stopPropagation()} 
                                sx={{ p: 0, ml: 0.5, color: 'primary.main' }}
                              >
                                <OpenInNewIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            )}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {c.status === 'EM_ANALISE' ? (
                          <Button 
                            variant="contained" 
                            color="primary" 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAprovacao(c);
                            }}
                            startIcon={<CheckCircleIcon />}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
                          >
                            Aprovar
                          </Button>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            Exibições: <strong>{c.total_exibicoes || 0}</strong>
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDelete(c);
                          }} 
                          sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'error.main' } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          
          {totalCardPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalCardPages} 
                page={cardPage} 
                onChange={(e, page) => setCardPage(page)} 
                color="primary" 
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': { borderRadius: 2 }
                }}
              />
            </Box>
          )}
        </Box>
      );
    }

    // viewMode === 'table'
    const totalTablePages = Math.ceil(filteredCampanhas.length / tableRowsPerPage);
    const paginatedTable = filteredCampanhas.slice((tablePage - 1) * tableRowsPerPage, tablePage * tableRowsPerPage);

    return (
      <Box>
        <TableContainer 
          component={Paper} 
          elevation={1} 
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden', 
            border: '1px solid', 
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Table sx={{ minWidth: 800 }} aria-label="tabela de campanhas">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Campanha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Turnos</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>TVs</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Duração</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mídia</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedTable.map((c) => {
                const hasVideo = c.midias && c.midias.length > 0 && c.midias[0].tipo === 'VIDEO';
                const mediaUrl = c.midias && c.midias.length > 0 ? c.midias[0].arquivo_url : null;
                return (
                  <TableRow 
                    key={c.id} 
                    hover
                    onClick={() => navigate(`/admin/editar/${c.id}`)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.selected'
                      },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    {/* Campanha */}
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {c.nome}
                        </Typography>
                        <Typography variant="body2" color="primary.main" fontWeight={600}>
                          {c.parceiro_nome || 'Parceiro desconhecido'}
                        </Typography>
                        {c.categoria && (
                          <Typography 
                            variant="caption" 
                            color="textSecondary" 
                            sx={{ 
                              bgcolor: 'action.hover', 
                              px: 0.8, 
                              py: 0.2, 
                              borderRadius: 1, 
                              display: 'inline-block', 
                              mt: 0.5 
                            }}
                          >
                            {c.categoria}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip 
                          label={c.status === 'EM_ANALISE' ? 'PENDENTE' : c.status.replace('_', ' ')} 
                          color={getStatusColor(c.status)} 
                          size="small"
                          sx={{ fontWeight: 'bold', fontSize: '0.7rem', px: 1 }}
                        />
                        {c.is_institucional && (
                          <Tooltip title="Vídeo Institucional / Hospital" arrow>
                            <LocalHospitalIcon color="primary" sx={{ fontSize: '1.1rem' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>

                    {/* Turnos */}
                    <TableCell>
                      {c.turnos && c.turnos.length > 0 ? (
                        renderTurnosChips(c.turnos, true)
                      ) : (
                        <Typography variant="body2" color="textSecondary">-</Typography>
                      )}
                    </TableCell>

                    {/* TVs */}
                    <TableCell>
                      {renderTvsChips(c.tvs)}
                    </TableCell>

                    {/* Período */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(c.data_inicio).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                        até {new Date(c.data_fim).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    {/* Duração */}
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="bold">
                        {c.duracao}s
                      </Typography>
                    </TableCell>

                    {/* Mídia */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                        {hasVideo ? <PlayArrowIcon sx={{ fontSize: 16, color: 'primary.main' }} /> : <ImageIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {hasVideo ? 'Vídeo' : 'Imagem'}
                        </Typography>
                        {mediaUrl && (
                          <IconButton 
                            size="small" 
                            href={mediaUrl} 
                            target="_blank" 
                            sx={{ p: 0.5, color: 'primary.main' }}
                          >
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>

                    {/* Ações */}
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                        {c.status === 'EM_ANALISE' && (
                          <Button 
                            variant="contained" 
                            color="primary" 
                            size="small"
                            onClick={() => handleOpenAprovacao(c)}
                            startIcon={<CheckCircleIcon />}
                            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 'bold' }}
                          >
                            Aprovar
                          </Button>
                        )}
                        <IconButton 
                          onClick={() => handleOpenDelete(c)} 
                          sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.light' } }}
                          title="Excluir"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer controls for Table Mode */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mt: 3, 
            flexWrap: 'wrap', 
            gap: 2,
            px: 1
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Itens por página:
            </Typography>
            <TextField
              select
              size="small"
              value={tableRowsPerPage}
              onChange={(e) => {
                setTableRowsPerPage(Number(e.target.value));
                setTablePage(1);
              }}
              sx={{ 
                width: 80, 
                bgcolor: 'background.paper',
                '& .MuiOutlinedInput-root': { borderRadius: 2 }
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={30}>30</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </TextField>
          </Box>
          
          {totalTablePages > 1 && (
            <Pagination 
              count={totalTablePages} 
              page={tablePage} 
              onChange={(e, page) => setTablePage(page)} 
              color="primary" 
              sx={{
                '& .MuiPaginationItem-root': { borderRadius: 2 }
              }}
            />
          )}
        </Box>
      </Box>
    );
  }, [
    filteredCampanhas, 
    loading, 
    navigate, 
    handleOpenAprovacao, 
    handleOpenDelete, 
    viewMode, 
    cardPage, 
    tablePage, 
    tableRowsPerPage
  ]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Painel de Gestão HED</Typography>
        <Typography variant="body2" color="textSecondary">Controle central de anúncios e campanhas</Typography>
      </Box>

      {kpiCards}

      {/* Ocupação do Inventário */}
      <Box sx={{ mb: 2.5, width: '100%' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1.5 }}>Ocupação por turno</Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          alignItems: { xs: 'stretch', sm: 'center' }, 
          gap: 2,
          flexWrap: 'wrap'
        }}>
          {/* Barra de Seleção de Dia da Semana */}
          <Box sx={{ 
            display: 'flex', 
            bgcolor: 'background.paper', 
            p: 0.5, 
            borderRadius: 3, 
            border: '1px solid', 
            borderColor: 'divider',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}>
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, idx) => {
              const isSelected = selectedDay === idx;
              return (
                <Button
                  key={idx}
                  size="small"
                  onClick={() => setSelectedDay(idx)}
                  sx={{
                    borderRadius: 2,
                    px: 2.5,
                    py: 0.75,
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    bgcolor: isSelected ? 'primary.main' : 'transparent',
                    color: isSelected ? 'primary.contrastText' : 'text.secondary',
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      bgcolor: isSelected ? 'primary.main' : 'action.hover',
                      color: isSelected ? 'primary.contrastText' : 'primary.main',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {dia}
                </Button>
              );
            })}
          </Box>

          {/* Seletor de TV */}
          <TextField
            select
            size="small"
            label="Filtrar por TV"
            value={selectedTv}
            onChange={(e) => setSelectedTv(e.target.value)}
            sx={{ 
              width: { xs: '100%', sm: 240 }, 
              bgcolor: 'background.paper',
              '& .MuiOutlinedInput-root': {
                borderRadius: 3
              }
            }}
          >
            {TVS_OPCOES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Manhã', key: 'MANHA', bg: 'linear-gradient(135deg, #FFF8E1, #FFECB3)', border: '#FFE082', textColor: '#FF8F00', barColor: '#FFB300' },
          { label: 'Tarde', key: 'TARDE', bg: 'linear-gradient(135deg, #E0F7FA, #B2EBF2)', border: '#80DEEA', textColor: '#00838F', barColor: '#00ACC1' },
          { label: 'Noite', key: 'NOITE', bg: 'linear-gradient(135deg, #EDE7F6, #D1C4E9)', border: '#B39DDB', textColor: '#6A1B9A', barColor: '#8E24AA' },
          { label: 'Madrugada', key: 'MADRUGADA', bg: 'linear-gradient(135deg, #ECEFF1, #CFD8DC)', border: '#B0BEC5', textColor: '#37474F', barColor: '#78909C' }
        ].map((t) => {
          const shiftData = ocupacaoData[t.key] || { vendido: 0, institucional: 0 };
          const vendido = shiftData.vendido;
          const institucional = shiftData.institucional;
          const percent = Math.min((vendido / 300) * 100, 100);
          
          return (
            <Grid item xs={12} sm={6} md={3} key={t.key}>
              <Paper 
                onClick={() => navigate(`/admin/preview?turno=${t.key}&dia=${selectedDay}&tv=${selectedTv}`)}
                sx={{ 
                  p: 2.5, 
                  borderRadius: 4,
                  background: t.bg,
                  border: `1px solid ${t.border}`,
                  cursor: 'pointer',
                  opacity: loadingOcupacao ? 0.75 : 1
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: t.textColor, lineHeight: 1.2 }}>
                    {t.label}
                  </Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" fontWeight="bold" sx={{ display: 'block', color: vendido > 300 ? 'error.main' : t.textColor, lineHeight: 1.2 }}>
                      {vendido}/300s
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: t.textColor, opacity: 0.85, fontSize: '0.72rem', mt: 0.2 }}>
                      Inst.: {institucional}s
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={percent} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 5, 
                    bgcolor: 'rgba(255, 255, 255, 0.4)', 
                    '& .MuiLinearProgress-bar': { bgcolor: t.barColor } 
                  }} 
                />
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {filterSection}
      {campaignGrid}

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
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                      Turnos de Exibição (Selecione um ou mais)
                    </Typography>
                    <ToggleButtonGroup
                      value={turnos}
                      onChange={(e, val) => val.length > 0 && setTurnos(val)}
                      exclusive={false}
                      aria-label="turnos"
                      fullWidth
                      sx={{ 
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        '& .MuiToggleButton-root': { 
                          flex: 1,
                          minWidth: '80px',
                          borderRadius: '12px !important', 
                          border: '1px solid !important',
                          borderColor: 'divider',
                          fontWeight: 'bold',
                          textTransform: 'none',
                          py: 1.5,
                          fontSize: '0.75rem',
                          '&.Mui-selected': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' }
                          }
                        } 
                      }}
                    >
                      <ToggleButton value="MANHA">Manhã</ToggleButton>
                      <ToggleButton value="TARDE">Tarde</ToggleButton>
                      <ToggleButton value="NOITE">Noite</ToggleButton>
                      <ToggleButton value="MADRUGADA">Madrugada</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, backgroundImage: 'none' } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pt: 3, px: 3 }}>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography>
            Tem certeza de que deseja excluir a campanha <strong>{campanhaToDelete?.nome}</strong>?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1, fontWeight: 'bold' }}>
            Esta ação é definitiva e removerá todos os agendamentos e mídias vinculadas.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'action.hover' }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="text" color="inherit" sx={{ fontWeight: 'bold' }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error" 
            sx={{ px: 4, borderRadius: 3, fontWeight: 'bold' }}
          >
            Excluir Definitivamente
          </Button>
        </DialogActions>
      </Dialog>

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
    </Container>
  );
};

export default AdminDashboard;
