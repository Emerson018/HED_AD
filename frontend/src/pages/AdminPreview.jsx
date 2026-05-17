import React, { useState, useEffect } from 'react';
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
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import TvIcon from '@mui/icons-material/Tv';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import CarouselLivePreview from '../components/CarouselLivePreview';

const AdminPreview = () => {
  const [campanhas, setCampanhas] = useState([]);
  const [turno, setTurno] = useState('MANHA');
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState('tv_sala_espera');
  const navigate = useNavigate();

  const getPlayerUrl = (clean = false) => {
    const base = `${window.location.protocol}//${window.location.host}`;
    return clean 
      ? `${base}/tv/player/${tokenInput}?clean=true` 
      : `${base}/tv/player/${tokenInput}`;
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
            Visualize como o conteúdo está sendo exibido em cada turno.
          </Typography>
        </Box>

        <Paper sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2" fontWeight="bold">Turno para Visualização:</Typography>
          <TextField
            select
            size="small"
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="MANHA">Manhã (07h - 12h)</MenuItem>
            <MenuItem value="TARDE">Tarde (12h - 18h)</MenuItem>
            <MenuItem value="NOITE">Noite (18h - 07h)</MenuItem>
          </TextField>
        </Paper>
      </Box>

      {/* Área do Player Ampliada */}
      <Box sx={{ 
        maxWidth: '1200px', 
        mx: 'auto', 
        p: 2, 
        bgcolor: '#1a1a1a', 
        borderRadius: 5, 
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        border: '8px solid #333',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: 'white', py: 4 }}>
            <CircularProgress color="inherit" />
            <Typography variant="body2" sx={{ opacity: 0.7 }}>Carregando simulação de transmissão...</Typography>
          </Box>
        ) : (
          <CarouselLivePreview campanhas={campanhas} turno={turno} />
        )}
      </Box>

      {/* Gerenciador de Links de Transmissão */}
      <Paper sx={{ mt: 4, p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
          📺 URLs de Transmissão para as TVs do Hospital
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configure o identificador (Token) da TV abaixo para gerar os links de reprodução corretos para os aparelhos físicos do hospital.
        </Typography>

        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, maxWidth: '400px' }}>
          <TextField
            label="Identificador da TV (Token)"
            size="small"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value.replace(/\s+/g, '_').toLowerCase())}
            helperText="Ex: tv_recepcao, tv_sala_espera"
            fullWidth
          />
        </Box>

        <Grid container spacing={3}>
          {/* Card 1: L-Bar */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary" gutterBottom>
                1. Player Institucional (Com L-Bar)
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Layout padrão contendo a identidade do hospital, relógio em tempo real, dicas de saúde e o vídeo da campanha à esquerda (80% / 20%).
              </Typography>
              
              <TextField
                fullWidth
                size="small"
                value={getPlayerUrl(false)}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2, bgcolor: 'background.paper' }}
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
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
            </Paper>
          </Grid>

          {/* Card 2: Vídeo Puro */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary" gutterBottom>
                2. Player de Vídeo Puro (Tela Cheia)
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Layout limpo sem máscara institucional. Ideal para TVs que devem passar apenas os vídeos das campanhas em tela cheia (100%).
              </Typography>

              <TextField
                fullWidth
                size="small"
                value={getPlayerUrl(true)}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2, bgcolor: 'background.paper' }}
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={() => window.open(getPlayerUrl(true), '_blank')}
                  startIcon={<LaunchIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Abrir Player
                </Button>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(getPlayerUrl(true));
                    alert('Link copiado para a área de transferência!');
                  }}
                  startIcon={<ContentCopyIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Copiar Link
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Info Adicional */}
      <Box sx={{ mt: 6, textAlign: 'center', opacity: 0.6 }}>
        <Typography variant="caption">
          * Este simulador utiliza as mesmas regras de exibição das TVs do Hospital Ernesto Dornelles.
        </Typography>
      </Box>
    </Container>
  );
};

export default AdminPreview;
