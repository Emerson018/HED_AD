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
// LogoutIcon removido pois está no Layout


const ParceiroHome = () => {
  const [stats, setStats] = useState({ total: 0, aprovadas: 0, pendentes: 0, totalExibicoes: 0 });
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
          totalExibicoes: data.reduce((acc, curr) => acc + (curr.total_exibicoes || 0), 0)
        });
      } catch (err) {
        console.error("Erro ao buscar estatísticas", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // handleLogout removido pois está no Layout


  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          Início
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Acompanhe o desempenho e status das suas campanhas.
        </Typography>
      </Box>

      {/* Cards de Resumo */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            borderRadius: 3,
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': { transform: 'translateY(-5px)', boxShadow: 10, cursor: 'pointer' }
          }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">Total de Campanhas</Typography>
              {loading ? <Skeleton variant="text" width={40} height={60} /> : (
                <Typography variant="h3" fontWeight="bold" sx={{ color: '#fff' }}>{stats.total}</Typography>
              )}
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
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">Ativas na TV</Typography>
              {loading ? <Skeleton variant="text" width={40} height={60} /> : (
                <Typography variant="h3" fontWeight="bold" sx={{ color: '#fff' }}>{stats.aprovadas}</Typography>
              )}
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
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">Em Análise</Typography>
              {loading ? <Skeleton variant="text" width={40} height={60} /> : (
                <Typography variant="h3" fontWeight="bold" sx={{ color: '#fff' }}>{stats.pendentes}</Typography>
              )}
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
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold">Exibições (Mês)</Typography>
              {loading ? <Skeleton variant="text" width={40} height={60} /> : (
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: '#fff' }}>{stats.totalExibicoes}</Typography>
                  <BarChartIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                </Box>
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
            Ver Minhas Campanhas
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ParceiroHome;
