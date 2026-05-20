import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  Container,
  Typography,
  Card,
  Chip,
  Button,
  Box,
  IconButton,
  Skeleton,
  Grid,
  CardContent,
  CardActions,
  Stack,
  TextField,
  MenuItem,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ImageIcon from '@mui/icons-material/Image';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import Brightness3Icon from '@mui/icons-material/Brightness3';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

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
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import HistoryIcon from '@mui/icons-material/History';
import BarChartIcon from '@mui/icons-material/BarChart';

const MinhasCampanhas = () => {
  const [campanhas, setCampanhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTurno, setFilterTurno] = useState('TODOS');
  const [filterDuracao, setFilterDuracao] = useState('TODAS');
  const [filterTipo, setFilterTipo] = useState('TODOS');
  const navigate = useNavigate();

  const filteredCampanhas = campanhas.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase());
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

  const clientStats = {
    total: campanhas.length,
    ativas: campanhas.filter(c => c.status === 'APROVADA' || c.status === 'ATIVA').length,
    pendentes: campanhas.filter(c => c.status === 'EM_ANALISE').length,
    totalExibicoes: campanhas.reduce((acc, curr) => acc + (curr.total_exibicoes || 0), 0),
    expiradas: campanhas.filter(c => c.status === 'EXPIRADA').length
  };

  useEffect(() => {
    fetchCampanhas();
  }, []);

  const fetchCampanhas = async () => {
    setLoading(true);
    try {
      const response = await api.get('campanhas/');
      setCampanhas(response.data);
    } catch (error) {
      console.error("Erro ao buscar campanhas", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.")) {
      try {
        await api.delete(`campanhas/${id}/`);
        fetchCampanhas();
      } catch (error) {
        console.error("Erro ao excluir campanha", error);
        alert("Não foi possível excluir esta campanha.");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ATIVA': return 'success';
      case 'APROVADA': return 'success';
      case 'EM_ANALISE': return 'warning';
      case 'PAUSADA': return 'error';
      case 'EXPIRADA': return 'default';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CampaignIcon fontSize="large" color="primary" />
            Minhas Campanhas
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddCircleIcon />}
          onClick={() => navigate('/parceiro/upload')}
          sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
        >
          Nova Campanha
        </Button>
      </Box>

      {/* KPI Cards do Cliente */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total de Campanhas', value: clientStats.total, color: 'primary.main', icon: <CampaignIcon /> },
          { label: 'Ativas na TV', value: clientStats.ativas, color: 'success.main', icon: <CheckCircleIcon /> },
          { label: 'Pendente', value: clientStats.pendentes, color: 'warning.main', icon: <PendingActionsIcon /> },
          { label: 'Exibições (Mês)', value: clientStats.totalExibicoes, color: 'secondary.main', icon: <BarChartIcon /> },
          { label: 'Expiradas', value: clientStats.expiradas, color: 'text.secondary', icon: <HistoryIcon /> }
        ].map((stat, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Card elevation={2} sx={{ 
              borderRadius: 3,
              borderLeft: '5px solid',
              borderColor: stat.color,
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: 10, cursor: 'pointer' }
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                  <Typography variant="body2" color="textSecondary" fontWeight="bold">{stat.label}</Typography>
                  {React.cloneElement(stat.icon, { sx: { color: stat.color } })}
                </Stack>
                {loading ? (
                  <Skeleton variant="text" width={40} height={32} />
                ) : (
                  <Typography variant="h4" fontWeight="bold" sx={{ color: stat.color }}>{stat.value}</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Barra de Filtros */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 4, width: '100%' }}>
        <TextField
          label="Buscar por nome da campanha..."
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
          sx={{ width: 130, bgcolor: 'background.paper' }}
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
          sx={{ width: 110, bgcolor: 'background.paper' }}
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
      </Box>

      {loading ? (
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
      ) : filteredCampanhas.length === 0 ? (
        <Card sx={{ borderRadius: 3, p: 6, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhuma campanha corresponde aos filtros selecionados.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredCampanhas.map((c) => {
            const hasVideo = c.midias && c.midias.length > 0 && c.midias[0].tipo === 'VIDEO';
            return (
              <Grid item xs={12} md={6} key={c.id} sx={{ display: 'flex' }}>
                <Card 
                  onClick={() => navigate(`/parceiro/editar/${c.id}`)}
                  sx={{ 
                    borderRadius: 4,
                    height: '100%',
                    minHeight: 350,
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
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
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
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          Mídia: {hasVideo ? 'Vídeo (MP4)' : 'Imagem'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0, height: 52, minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 1 }}>
                      <Typography variant="caption" color="textSecondary">
                        Exibições: <strong>{c.total_exibicoes || 0}</strong>
                      </Typography>
                    </Box>
                    <IconButton 
                      onClick={(e) => {
                        e.stopPropagation(); // Evita redirecionar para a edição
                        handleDelete(c.id);
                      }} 
                      sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'error.main' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default MinhasCampanhas;
