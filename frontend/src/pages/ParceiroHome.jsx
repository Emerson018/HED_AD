import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Stack,
  Skeleton
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import BarChartIcon from '@mui/icons-material/BarChart';
import CampaignIcon from '@mui/icons-material/Campaign';

const ParceiroHome = () => {
  const [stats, setStats] = useState({ total: 0, aprovadas: 0, pendentes: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('campanhas/');
        const data = res.data;
        setStats({
          total: data.length,
          aprovadas: data.filter(c => c.status === 'APROVADA').length,
          pendentes: data.filter(c => c.status === 'EM_ANALISE').length,
        });
      } catch (err) {
        console.error("Erro ao buscar estatísticas", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          Bem-vindo à sua Área de Cliente
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Aqui você pode gerenciar suas campanhas e acompanhar o status de exibição no hospital.
        </Typography>
      </Box>

      {/* Cards de Resumo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6">Total de Campanhas</Typography>
              {loading ? <Skeleton variant="text" width={40} height={60} /> : (
                <Typography variant="h2" fontWeight="bold">{stats.total}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#2e7d32', color: 'white', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6">Ativas na TV</Typography>
              {loading ? <Skeleton variant="text" width={40} height={60} /> : (
                <Typography variant="h2" fontWeight="bold">{stats.aprovadas}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: '#ed6c02', color: 'white', borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6">Em Análise</Typography>
              {loading ? <Skeleton variant="text" width={40} height={60} /> : (
                <Typography variant="h2" fontWeight="bold">{stats.pendentes}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ações Rápidas */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>Ações Rápidas</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Button 
            fullWidth 
            variant="outlined" 
            size="large" 
            startIcon={<AddCircleIcon />}
            onClick={() => navigate('/parceiro/upload')}
            sx={{ py: 3, borderRadius: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          >
            Criar Nova Campanha
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button 
            fullWidth 
            variant="outlined" 
            size="large" 
            startIcon={<CampaignIcon />}
            onClick={() => navigate('/parceiro/campanhas')}
            sx={{ py: 3, borderRadius: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          >
            Ver Minhas Mídias
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ParceiroHome;
