import React, { useState, useEffect } from 'react';
import { uploadMidia } from '../utils/supabaseClient';
import api from '../utils/api';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Stack,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CampaignIcon from '@mui/icons-material/Campaign';

const ParceiroDashboard = () => {
  const [campanhas, setCampanhas] = useState([]);
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleCreateCampanha = async (e) => {
    e.preventDefault();
    if (!file || !nomeCampanha) {
      alert("Preencha o nome e selecione um arquivo.");
      return;
    }

    setLoading(true);
    try {
      const publicUrl = await uploadMidia(file);
      const hoje = new Date().toISOString().split('T')[0];
      const daquiUmMes = new Date();
      daquiUmMes.setMonth(daquiUmMes.getMonth() + 1);
      const fim = daquiUmMes.toISOString().split('T')[0];

      const campanhaResponse = await api.post('campanhas/', {
        nome: nomeCampanha,
        status: 'EM_ANALISE',
        data_inicio: hoje,
        data_fim: fim,
      });

      const campanhaId = campanhaResponse.data.id;

      await api.post('midias/', {
        campanha: campanhaId,
        tipo: file.type.startsWith('video') ? 'VIDEO' : 'IMAGEM',
        arquivo_url: publicUrl
      });

      setNomeCampanha('');
      setFile(null);
      fetchCampanhas();
      alert("Campanha enviada para análise!");
    } catch (error) {
      console.error("Erro no processo de criação", error);
    } finally {
      setLoading(false);
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
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CampaignIcon fontSize="large" color="primary" />
        Painel do Parceiro
      </Typography>

      <Card sx={{ mb: 4, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="secondary">
            Nova Campanha
          </Typography>
          <Box component="form" onSubmit={handleCreateCampanha} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Nome da Campanha"
              variant="outlined"
              fullWidth
              value={nomeCampanha}
              onChange={(e) => setNomeCampanha(e.target.value)}
            />
            
            <Box sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', borderRadius: 2 }}>
              <input
                accept="video/mp4,image/*"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <label htmlFor="raised-button-file">
                <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                  Selecionar Mídia
                </Button>
              </label>
              {file && <Typography sx={{ mt: 1 }}>{file.name}</Typography>}
            </Box>

            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Processando...' : 'Enviar para o HED'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Minhas Campanhas
      </Typography>
      <Card>
        <List>
          {campanhas.map((c, index) => (
            <React.Fragment key={c.id}>
              <ListItem sx={{ py: 2 }}>
                <ListItemText 
                  primary={c.nome} 
                  secondary={`Início: ${c.data_inicio} - Fim: ${c.data_fim}`} 
                />
                <Chip 
                  label={c.status.replace('_', ' ')} 
                  color={getStatusColor(c.status)} 
                  variant="outlined" 
                />
              </ListItem>
              {index < campanhas.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {campanhas.length === 0 && (
            <Typography sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              Nenhuma campanha enviada ainda.
            </Typography>
          )}
        </List>
      </Card>
    </Container>
  );
};

export default ParceiroDashboard;
