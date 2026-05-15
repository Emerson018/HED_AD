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
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  MenuItem
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CampaignIcon from '@mui/icons-material/Campaign';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';


const ParceiroDashboard = () => {
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [duracao, setDuracao] = useState(15);
  const [turno, setTurno] = useState('INTEGRAL');
  const [categoria, setCategoria] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const showMessage = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      showMessage("Aviso: Este arquivo tem mais de 10MB e não poderá ser enviado.", "warning");
      setFile(null);
      e.target.value = null;
      return;
    }

    setFile(selectedFile);

    // Extração automática de tempo se for vídeo
    if (selectedFile.type.startsWith('video')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const seconds = Math.round(video.duration);
        
        // Regra de negócio: 15, 30 ou 60
        if (seconds <= 20) setDuracao(15);
        else if (seconds <= 40) setDuracao(30);
        else setDuracao(60);
        
        showMessage(`Duração detectada: ${seconds} segundos. Ajustado para ${seconds <= 20 ? 15 : seconds <= 40 ? 30 : 60}s.`, "info");
      };
      video.src = URL.createObjectURL(selectedFile);
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
      showMessage("Iniciando upload para o Supabase...", "info");
      const publicUrl = await uploadMidia(file);
      
      if (!publicUrl) {
        throw new Error("Não foi possível obter a URL pública do arquivo.");
      }

      showMessage("Criando registro da campanha...", "info");
      const campanhaResponse = await api.post('campanhas/', {
        nome: nomeCampanha,
        status: 'EM_ANALISE',
        duracao: parseInt(duracao),
        turno: turno,
        categoria: categoria,
        data_inicio: dataInicio,
        data_fim: dataFim,
      });

      const campanhaId = campanhaResponse.data.id;

      showMessage("Salvando mídia e finalizando...", "info");
      const fileType = file.type.startsWith('video') ? 'VIDEO' : 'IMAGEM';
      
      await api.post('midias/', {
        campanha: campanhaId,
        tipo: fileType,
        arquivo_url: publicUrl
      });

      setNomeCampanha('');
      setFile(null);
      showMessage("Campanha enviada com sucesso para análise!", "success");
      
      setTimeout(() => {
        navigate('/parceiro/campanhas');
      }, 2000);
      
    } catch (error) {
      console.error("Erro no processo de criação:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Erro desconhecido ao salvar.";
      showMessage(`Falha ao salvar: ${errorMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/parceiro')} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CampaignIcon fontSize="large" color="primary" />
          Nova Campanha
        </Typography>
      </Box>

      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="secondary">
            Configurações do Anúncio
          </Typography>
          <Box component="form" onSubmit={handleCreateCampanha} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label="Nome da Campanha"
              variant="outlined"
              fullWidth
              value={nomeCampanha}
              onChange={(e) => setNomeCampanha(e.target.value)}
              required
            />

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                select
                label="Duração"
                fullWidth
                sx={{ flex: 1, minWidth: '120px' }}
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                helperText="Tempo de exibição (seg)"
              >
                <MenuItem value={15}>15 segundos</MenuItem>
                <MenuItem value={30}>30 segundos</MenuItem>
                <MenuItem value={60}>60 segundos</MenuItem>
              </TextField>

              <TextField
                select
                label="Turno de Exibição"
                fullWidth
                sx={{ flex: 1, minWidth: '200px' }}
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                helperText="Horário preferencial"
              >
                <MenuItem value="INTEGRAL">Integral (Todos os horários)</MenuItem>
                <MenuItem value="MANHA">Manhã (07:00 - 11:59)</MenuItem>
                <MenuItem value="TARDE">Tarde (12:00 - 17:59)</MenuItem>
                <MenuItem value="NOITE">Noite (18:00 - 06:59)</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Data de Início"
                type="date"
                fullWidth
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
              <TextField
                label="Data de Término"
                type="date"
                fullWidth
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
              />
            </Box>

            <TextField
              label="Categoria (Opcional)"
              variant="outlined"
              placeholder="Ex: Alimentação, Saúde, Serviços..."
              fullWidth
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
            
            <Box sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', borderRadius: 2 }}>
              <input
                accept="video/mp4,image/*"
                style={{ display: 'none' }}
                id="raised-button-file"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="raised-button-file">
                <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                  Selecionar Mídia
                </Button>
              </label>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Máximo 10MB (Apenas 15s, 30s ou 60s)
              </Typography>
              {file && <Typography sx={{ mt: 1, fontWeight: 'bold', color: 'primary.main' }}>{file.name}</Typography>}
            </Box>

            <Button 
              type="submit" 
              variant="contained" 
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              sx={{ py: 1.5, fontWeight: 'bold' }}
            >
              {loading ? 'Processando...' : 'Enviar para o HED'}
            </Button>
          </Box>
        </CardContent>
      </Card>



      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ParceiroDashboard;
