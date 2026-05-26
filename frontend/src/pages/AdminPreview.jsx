import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  TextField, 
  MenuItem, 
  IconButton, 
  Paper,
  Stack,
  Breadcrumbs,
  Link,
  Skeleton,
  CircularProgress,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import TvIcon from '@mui/icons-material/Tv';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import CarouselLivePreview from '../components/CarouselLivePreview';

const TVS_OPCOES = [
  { value: 'sala_espera', label: 'Sala de Espera' },
  { value: 'recepcao', label: 'Recepção' },
  { value: 'sala_cirurgia', label: 'Sala de Cirurgia' },
  { value: 'corredor', label: 'Corredor Principal' }
];

const AdminPreview = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const forcedTurno = searchParams.get('turno');
  const forcedDia = searchParams.get('dia');
  const forcedTv = searchParams.get('tv');

  const getTodayPyWeekday = () => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  };

  const [campanhas, setCampanhas] = useState([]);
  const [turno, setTurno] = useState(
    forcedTurno && ['MANHA', 'TARDE', 'NOITE', 'MADRUGADA'].includes(forcedTurno.toUpperCase()) 
      ? forcedTurno.toUpperCase() 
      : 'MANHA'
  );
  const [diaSemana, setDiaSemana] = useState(
    forcedDia !== null && !isNaN(parseInt(forcedDia))
      ? parseInt(forcedDia)
      : getTodayPyWeekday()
  );
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState(
    forcedTv && ['sala_espera', 'recepcao', 'sala_cirurgia', 'corredor'].includes(forcedTv.toLowerCase())
      ? forcedTv.toLowerCase()
      : 'sala_espera'
  );
  const navigate = useNavigate();

  const handleTurnoChange = (e) => {
    const newTurno = e.target.value;
    setTurno(newTurno);
    setSearchParams({ turno: newTurno, dia: diaSemana.toString(), tv: tokenInput }, { replace: true });
  };

  const handleDiaChange = (e) => {
    const newDia = parseInt(e.target.value);
    setDiaSemana(newDia);
    setSearchParams({ turno, dia: newDia.toString(), tv: tokenInput }, { replace: true });
  };

  const handleTvChange = (e) => {
    const newTv = e.target.value;
    setTokenInput(newTv);
    setSearchParams({ turno, dia: diaSemana.toString(), tv: newTv }, { replace: true });
  };

  const playlist = useMemo(() => {
    const filtered = campanhas.filter(c => 
      (c.status === 'APROVADA' || c.status === 'ATIVA') && 
      (c.turnos && c.turnos.includes(turno)) &&
      (c.dias_semana && c.dias_semana.includes(diaSemana)) &&
      (!c.tvs || c.tvs.includes(tokenInput))
    );
    
    const comerciais = filtered.filter(c => !c.is_institucional);
    const institucionais = filtered.filter(c => c.is_institucional);
    
    const tempo_ocupado = comerciais.reduce((acc, curr) => acc + (curr.duracao || 0), 0);
    const tempo_livre = Math.max(0, 300 - tempo_ocupado);
    
    const institucionais_selecionados = [];
    let tempo_acumulado_institucional = 0;
    for (const c of institucionais) {
      if (tempo_acumulado_institucional + (c.duracao || 0) <= tempo_livre) {
        institucionais_selecionados.push(c);
        tempo_acumulado_institucional += (c.duracao || 0);
      }
    }
    
    return [...comerciais, ...institucionais_selecionados];
  }, [campanhas, turno, diaSemana, tokenInput]);

  const getPlayerUrl = (clean = false) => {
    const base = `${window.location.protocol}//${window.location.host}`;
    const queryParams = [];
    if (clean) queryParams.push('clean=true');
    if (turno) queryParams.push(`turno=${turno}`);
    queryParams.push(`dia=${diaSemana}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return `${base}/tv/player/${tokenInput}${queryString}`;
  };

  useEffect(() => {
    const fetchCampanhas = async () => {
      try {
        const res = await api.get('campanhas/');
        setCampanhas(res.data);
      } catch (err) {
        console.error("Erro ao buscar campanhas", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampanhas();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Navegação Superior */}
      <Box sx={{ 
        mb: 4, 
        display: 'flex', 
        flexDirection: { xs: 'column', lg: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', lg: 'flex-start' },
        gap: 2 
      }}>
        <Box>
          <Breadcrumbs sx={{ mb: 1 }}>
            <Link 
              underline="hover" 
              color="inherit" 
              onClick={() => navigate('/admin')} 
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Dashboard
            </Link>
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              <TvIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Preview do Player
            </Typography>
          </Breadcrumbs>
          <Typography variant="h3" fontWeight="bold" color="primary">
            Simulador de Transmissão
          </Typography>
          <Typography variant="body1" color="textSecondary">
          </Typography>
        </Box>

        <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2.5, boxShadow: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>Dia da Semana:</Typography>
            <TextField
              select
              size="small"
              value={diaSemana}
              onChange={handleDiaChange}
              sx={{ width: 160 }}
            >
              <MenuItem value={0}>Segunda-feira</MenuItem>
              <MenuItem value={1}>Terça-feira</MenuItem>
              <MenuItem value={2}>Quarta-feira</MenuItem>
              <MenuItem value={3}>Quinta-feira</MenuItem>
              <MenuItem value={4}>Sexta-feira</MenuItem>
              <MenuItem value={5}>Sábado</MenuItem>
              <MenuItem value={6}>Domingo</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>Turno:</Typography>
            <TextField
              select
              size="small"
              value={turno}
              onChange={handleTurnoChange}
              sx={{ width: 180 }}
            >
              <MenuItem value="MANHA">Manhã (06h - 12h)</MenuItem>
              <MenuItem value="TARDE">Tarde (12h - 18h)</MenuItem>
              <MenuItem value="NOITE">Noite (18h - 00h)</MenuItem>
              <MenuItem value="MADRUGADA">Madrugada (00h - 06h)</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ whiteSpace: 'nowrap' }}>TV Selecionada:</Typography>
            <TextField
              select
              size="small"
              value={tokenInput}
              onChange={handleTvChange}
              sx={{ width: 180 }}
            >
              {TVS_OPCOES.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Paper>
      </Box>

      {/* Tabela de Programação do Turno */}
      {!loading && (
        <Paper sx={{ mt: 4, p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            📋 Playlist de Transmissão Programada
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', width: '80px' }}>Ordem</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Campanha</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Parceiro</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>Duração</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '180px' }}>Categoria</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {playlist.length > 0 ? (
                  playlist.map((campanha, index) => (
                    <TableRow 
                      key={campanha.id} 
                      hover 
                      sx={{ 
                        '&:last-child td, &:last-child th': { border: 0 }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        #{index + 1}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        {campanha.nome}
                      </TableCell>
                      <TableCell>
                        {campanha.parceiro_nome || 'Institucional (HED)'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${campanha.duracao || 15}s`} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontWeight: 'bold' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={campanha.is_institucional ? 'Institucional' : 'Comercial'} 
                          color={campanha.is_institucional ? 'secondary' : 'primary'} 
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        {campanha.categoria ? (
                          <Chip 
                            label={campanha.categoria} 
                            size="small"
                            variant="outlined"
                            sx={{ opacity: 0.8 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary" variant="subtitle1">
                        Nenhuma campanha programada para ser exibida nesta playlist.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Gerenciador de Links de Transmissão */}
      <Paper sx={{ mt: 4, p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                  URL de Transmissão para a TV Selecionada
                </Typography>
                <Typography variant="body2" color="textSecondary">
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => window.open(getPlayerUrl(false), '_blank')}
                  startIcon={<LaunchIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Abrir Player
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(getPlayerUrl(false));
                    alert('Link copiado para a área de transferência!');
                  }}
                  startIcon={<ContentCopyIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Copiar Link
                </Button>
              </Box>
            </Box>
            
            <TextField
              fullWidth
              size="small"
              value={getPlayerUrl(false)}
              InputProps={{ readOnly: true }}
              sx={{ mt: 2, bgcolor: 'action.hover' }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Área do Player Ampliada */}
      <Box sx={{ 
        maxWidth: '1200px', 
        mx: 'auto', 
        mt: 4,
        p: 2, 
        bgcolor: 'background.default', 
        borderRadius: 5, 
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        border: '8px solid',
        borderColor: 'divider',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: 'text.secondary', py: 4 }}>
            <CircularProgress color="inherit" />
            <Typography variant="body2" sx={{ opacity: 0.7 }}>Carregando simulação de transmissão...</Typography>
          </Box>
        ) : (
          <CarouselLivePreview playlist={playlist} turno={turno} />
        )}
      </Box>

      {/* Info Adicional */}
    </Container>
  );
};

export default AdminPreview;
