import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import GavelIcon from '@mui/icons-material/Gavel';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';

const AdminOpcoes = () => {
  const navigate = useNavigate();

  const opcoes = [
    {
      title: 'Dúvidas (FAQ)',
      description: 'Perguntas frequentes sobre o funcionamento do sistema.',
      icon: <HelpIcon sx={{ fontSize: 40 }} />,
      path: '/faq',
      color: '#3b82f6',
    },
    {
      title: 'Termos de Uso',
      description: 'Termos e condições de uso da plataforma HED Campanhas.',
      icon: <GavelIcon sx={{ fontSize: 40 }} />,
      path: '/termos',
      color: '#8b5cf6',
    },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SettingsIcon fontSize="large" color="primary" />
          Opções
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
          Configurações e informações gerais do sistema.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {opcoes.map((opcao) => (
          <Grid size={6} key={opcao.title}>
            <Card
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardActionArea onClick={() => navigate(opcao.path)} sx={{ p: 3 }}>
                <CardContent sx={{ textAlign: 'center', p: 0 }}>
                  <Box sx={{ color: opcao.color, mb: 2 }}>
                    {opcao.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {opcao.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {opcao.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminOpcoes;
