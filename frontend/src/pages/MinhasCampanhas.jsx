import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  Container,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Button,
  Box,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddCircleIcon from '@mui/icons-material/AddCircle';

const MinhasCampanhas = () => {
  const [campanhas, setCampanhas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampanhas();
  }, []);

  const fetchCampanhas = async () => {
    try {
      const response = await api.get('campanhas/');
      setCampanhas(response.data);
    } catch (error) {
      console.error("Erro ao buscar campanhas", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ATIVA': return 'success';
      case 'EM_ANALISE': return 'warning';
      case 'PAUSADA': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/parceiro')} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CampaignIcon fontSize="large" color="primary" />
            Minhas Campanhas
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddCircleIcon />}
          onClick={() => navigate('/parceiro/upload')}
        >
          Nova Campanha
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        <List>
          {campanhas.map((c, index) => (
            <React.Fragment key={c.id}>
              <ListItem sx={{ py: 2 }}>
                <ListItemText 
                  primary={
                    <Typography variant="h6" fontWeight="medium">
                      {c.nome}
                    </Typography>
                  } 
                  secondary={`Início: ${new Date(c.data_inicio).toLocaleDateString()} - Fim: ${new Date(c.data_fim).toLocaleDateString()}`} 
                />
                <Chip 
                  label={c.status.replace('_', ' ')} 
                  color={getStatusColor(c.status)} 
                  variant="filled"
                  sx={{ fontWeight: 'bold' }}
                />
              </ListItem>
              {index < campanhas.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {campanhas.length === 0 && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma campanha encontrada.
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/parceiro/upload')}
              >
                Criar minha primeira campanha
              </Button>
            </Box>
          )}
        </List>
      </Card>
    </Container>
  );
};

export default MinhasCampanhas;
