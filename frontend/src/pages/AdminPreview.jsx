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
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import TvIcon from '@mui/icons-material/Tv';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import CarouselLivePreview from '../components/CarouselLivePreview';

const AdminPreview = () => {
  const [campanhas, setCampanhas] = useState([]);
  const [turno, setTurno] = useState('MANHA');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
