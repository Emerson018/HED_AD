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
  MenuItem,
  Link,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CampaignIcon from '@mui/icons-material/Campaign';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TvIcon from '@mui/icons-material/Tv';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate, useParams } from 'react-router-dom';
import logoHed from '../assets/logo-hed.png';
import SmartVideoPlayer from '../components/SmartVideoPlayer';


const ParceiroDashboard = ({ isEdit = false, isAdmin = false }) => {
  const { id } = useParams();
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [duracao, setDuracao] = useState(15);
  const [turnos, setTurnos] = useState(['MANHA', 'TARDE', 'NOITE', 'MADRUGADA']);
  const [categoria, setCategoria] = useState('');
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    if (!isAdmin) {
      d.setDate(d.getDate() + 1); // No mínimo amanhã para parceiros comerciais
    }
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 31); // dataInicio + 30 dias
    return d.toISOString().split('T')[0];
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [existingMediaUrl, setExistingMediaUrl] = useState('');
  const [existingMediaId, setExistingMediaId] = useState(null);
  const [existingMediaType, setExistingMediaType] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [diasSemana, setDiasSemana] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [isInstitucional, setIsInstitucional] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  // Widgets Simulação da TV
  const [simulatedTime, setSimulatedTime] = useState(new Date());
  const [dicaIndex, setDicaIndex] = useState(0);

  const DICAS_SAUDE = [
    "Beba pelo menos 2 litros de água por dia.",
    "Lave as mãos com frequência para evitar infecções.",
    "Mantenha seus exames de rotina em dia.",
    "Pratique pelo menos 30 minutos de exercício físico diário.",
    "Uma boa noite de sono melhora sua imunidade."
  ];

  useEffect(() => {
    const clockInterval = setInterval(() => setSimulatedTime(new Date()), 1000);
    const dicaInterval = setInterval(() => {
      setDicaIndex((prev) => (prev + 1) % DICAS_SAUDE.length);
    }, 10000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(dicaInterval);
    };
  }, []);

  // Cleanup de URLs locais temporárias
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isEdit && dataInicio) {
      const start = new Date(dataInicio + 'T00:00:00');
      start.setDate(start.getDate() + 30);
      setDataFim(start.toISOString().split('T')[0]);
    }
  }, [dataInicio, isEdit]);

  useEffect(() => {
    if (isEdit && id) {
      fetchCampaignDetails();
    }
  }, [isEdit, id]);

  const fetchCampaignDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`campanhas/${id}/`);
      const c = response.data;
      setNomeCampanha(c.nome);
      setDuracao(c.duracao);
      setTurnos(c.turnos && c.turnos.length > 0 ? c.turnos : ['MANHA', 'TARDE', 'NOITE', 'MADRUGADA']);
      setCategoria(c.categoria || '');
      setDataInicio(c.data_inicio);
      setDataFim(c.data_fim);
      setStatus(c.status);
      if (c.dias_semana && c.dias_semana.length > 0) {
        setDiasSemana(c.dias_semana);
      }
      setIsInstitucional(c.is_institucional || false);
      
      if (c.midias && c.midias.length > 0) {
        setExistingMediaUrl(c.midias[0].arquivo_url);
        setExistingMediaId(c.midias[0].id);
        setExistingMediaType(c.midias[0].tipo);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da campanha", error);
      showMessage("Erro ao carregar dados da campanha.", "error");
    } finally {
      setLoading(false);
    }
  };

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

    // Revogar a URL anterior se houver
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const localUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(localUrl);

    // Extração automática de tempo se for vídeo
    if (selectedFile.type.startsWith('video')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const seconds = Math.round(video.duration) || 15;
        setDuracao(seconds);
        showMessage(`Duração real detectada: ${seconds}s.`, "info");
      };
      video.src = localUrl;
    } else {
      // Imagem - padrão 15s
      setDuracao(15);
    }
  };

  const handleCreateCampanha = async (e) => {
    e.preventDefault();
    if (!file && !existingMediaUrl) {
      alert("Selecione um arquivo de mídia.");
      return;
    }
    if (!nomeCampanha) {
      alert("Preencha o nome da campanha.");
      return;
    }

    setLoading(true);
    try {
      let publicUrl = existingMediaUrl;
      
      if (file) {
        showMessage("Iniciando upload para o Supabase...", "info");
        publicUrl = await uploadMidia(file);
        
        if (!publicUrl) {
          throw new Error("Não foi possível obter a URL pública do arquivo.");
        }
      }

      let campanhaId = id;

      if (isEdit) {
        showMessage("Atualizando registro da campanha...", "info");
        await api.patch(`campanhas/${id}/`, {
          nome: nomeCampanha,
          duracao: parseInt(duracao),
          turnos: turnos,
          categoria: categoria,
          data_inicio: dataInicio,
          data_fim: dataFim,
          dias_semana: diasSemana,
          is_institucional: isInstitucional,
        });

        if (file) {
          showMessage("Salvando nova mídia...", "info");
          const fileType = file.type.startsWith('video') ? 'VIDEO' : 'IMAGEM';
          
          if (existingMediaId) {
            await api.put(`midias/${existingMediaId}/`, {
              campanha: campanhaId,
              tipo: fileType,
              arquivo_url: publicUrl
            });
          } else {
            await api.post('midias/', {
              campanha: campanhaId,
              tipo: fileType,
              arquivo_url: publicUrl
            });
          }
        }
        
        showMessage("Campanha atualizada com sucesso!", "success");
      } else {
        showMessage("Criando registro da campanha...", "info");
        const campanhaResponse = await api.post('campanhas/', {
          nome: nomeCampanha,
          status: 'EM_ANALISE',
          duracao: parseInt(duracao),
          turnos: turnos,
          categoria: categoria,
          data_inicio: dataInicio,
          data_fim: dataFim,
          dias_semana: diasSemana,
          is_institucional: isInstitucional,
        });

        campanhaId = campanhaResponse.data.id;

        showMessage("Salvando mídia e finalizando...", "info");
        const fileType = file.type.startsWith('video') ? 'VIDEO' : 'IMAGEM';
        
        await api.post('midias/', {
          campanha: campanhaId,
          tipo: fileType,
          arquivo_url: publicUrl
        });
        
        showMessage("Campanha enviada com sucesso para análise!", "success");
      }

      setNomeCampanha('');
      setFile(null);
      
      setTimeout(() => {
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/parceiro/campanhas');
        }
      }, 2000);
      
    } catch (error) {
      console.error("Erro no processo de salvamento:", error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.non_field_errors?.[0] || error.message || "Erro desconhecido ao salvar.";
      showMessage(`Falha ao salvar: ${errorMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(isAdmin ? '/admin' : isEdit ? '/parceiro/campanhas' : '/parceiro')} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CampaignIcon fontSize="large" color="primary" />
          {isEdit ? 'Editar Campanha' : 'Nova Campanha'}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Formulário (Coluna Esquerda) */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary" sx={{ fontWeight: 'bold' }}>
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

                {isAdmin && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isInstitucional}
                        onChange={(e) => setIsInstitucional(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Campanha Institucional (Tapa-buracos)
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Usada para preencher tempo ocioso. Não consome cota do inventário comercial.
                        </Typography>
                      </Box>
                    }
                  />
                )}

                <Box sx={{ width: '100%' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                    Turnos de Exibição (Selecione um ou mais)
                  </Typography>
                  <ToggleButtonGroup
                    value={turnos}
                    onChange={(e, val) => val.length > 0 && setTurnos(val)}
                    exclusive={false}
                    aria-label="turnos de exibição"
                    fullWidth
                    sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      '& .MuiToggleButton-root': {
                        flex: 1,
                        minWidth: '100px',
                        borderRadius: '12px !important',
                        border: '1px solid !important',
                        borderColor: 'divider',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        py: 1.5,
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }
                      }
                    }}
                  >
                    <ToggleButton value="MANHA" aria-label="manhã">Manhã (06:00 - 11:59)</ToggleButton>
                    <ToggleButton value="TARDE" aria-label="tarde">Tarde (12:00 - 17:59)</ToggleButton>
                    <ToggleButton value="NOITE" aria-label="noite">Noite (18:00 - 23:59)</ToggleButton>
                    <ToggleButton value="MADRUGADA" aria-label="madrugada">Madrugada (00:00 - 05:59)</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Data de Início"
                    type="date"
                    fullWidth
                    sx={{ flex: 1 }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: (!isEdit && !isAdmin) ? (() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        return tomorrow.toISOString().split('T')[0];
                      })() : undefined
                    }}
                    value={dataInicio}
                    disabled={isEdit && status !== '' && status !== 'EM_ANALISE' && !isAdmin}
                    onChange={(e) => setDataInicio(e.target.value)}
                    required
                  />
                  <TextField
                    label="Data de Término (Calculada - 30 Dias)"
                    type="date"
                    fullWidth
                    sx={{ flex: 1 }}
                    InputLabelProps={{ shrink: true }}
                    value={dataFim}
                    disabled={!isAdmin}
                    onChange={(e) => setDataFim(e.target.value)}
                    required
                  />
                </Box>

                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Dias da Semana para Exibição
                  </Typography>
                  <ToggleButtonGroup
                    value={diasSemana}
                    onChange={(e, newDays) => {
                      if (newDays.length > 0) {
                        setDiasSemana(newDays);
                      }
                    }}
                    exclusive={false}
                    aria-label="dias da semana"
                    size="small"
                    sx={{ 
                      gap: 1, 
                      flexWrap: 'wrap',
                      '& .MuiToggleButton-root': {
                        borderRadius: '50% !important',
                        width: 40,
                        height: 40,
                        border: '1px solid !important',
                        borderColor: 'divider',
                        fontWeight: 'bold',
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }
                      }
                    }}
                  >
                    <ToggleButton value={0} aria-label="segunda">S</ToggleButton>
                    <ToggleButton value={1} aria-label="terça">T</ToggleButton>
                    <ToggleButton value={2} aria-label="quarta">Q</ToggleButton>
                    <ToggleButton value={3} aria-label="quinta">Q</ToggleButton>
                    <ToggleButton value={4} aria-label="sexta">S</ToggleButton>
                    <ToggleButton value={5} aria-label="sábado">S</ToggleButton>
                    <ToggleButton value={6} aria-label="domingo">D</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <TextField
                  select
                  label="Categoria (Opcional)"
                  variant="outlined"
                  fullWidth
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <MenuItem value=""><em>Nenhuma / Não especificada</em></MenuItem>
                  <MenuItem value="Saúde">Saúde</MenuItem>
                  <MenuItem value="Alimentação">Alimentação</MenuItem>
                  <MenuItem value="Serviços">Serviços</MenuItem>
                  <MenuItem value="Produto">Produto</MenuItem>
                  <MenuItem value="Promoção / Vendas">Promoção / Vendas</MenuItem>
                  <MenuItem value="Institucional">Institucional</MenuItem>
                  <MenuItem value="Eventos">Eventos</MenuItem>
                  <MenuItem value="Entretenimento">Entretenimento</MenuItem>
                  <MenuItem value="Outros">Outros</MenuItem>
                </TextField>
                
                <Box sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'action.hover' }}>
                  <input
                    accept="video/mp4,image/*"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="raised-button-file">
                    <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />}>
                      {existingMediaUrl ? 'Substituir Mídia' : 'Selecionar Mídia'}
                    </Button>
                  </label>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Máximo 10MB (A duração real do vídeo será usada)
                  </Typography>
                  {file ? (
                    <Typography sx={{ mt: 1, fontWeight: 'bold', color: 'primary.main' }}>Novo arquivo: {file.name}</Typography>
                  ) : existingMediaUrl ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" display="block" color="textSecondary">Mídia atual:</Typography>
                      <Link href={existingMediaUrl} target="_blank" rel="noopener" sx={{ fontWeight: 'medium' }}>
                        Visualizar mídia cadastrada
                      </Link>
                    </Box>
                  ) : null}
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <AccessTimeIcon color="primary" />
                    <Typography variant="body2" fontWeight="bold">
                      Duração da campanha: {duracao} {duracao === 1 ? 'segundo' : 'segundos'}
                    </Typography>
                  </Box>
                </Box>

                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                  sx={{ py: 1.5, fontWeight: 'bold' }}
                >
                  {loading ? 'Processando...' : isEdit ? 'Salvar Alterações' : 'Enviar para o HED'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Simulador da TV (Coluna Direita) */}
        <Grid item xs={12} md={5}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TvIcon color="primary" />
              Simulador da TV do Hospital
            </Typography>
            
            {/* TV Frame Bezel */}
            <Box 
              sx={{
                width: '100%',
                bgcolor: '#1a1a1a',
                borderRadius: 4,
                p: 1.5,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)',
                border: '4px solid #2d2d2d',
                position: 'relative'
              }}
            >
              {/* Screen Area (16:9) */}
              <Box 
                sx={{
                  width: '100%',
                  pt: '56.25%', // 16:9 Aspect Ratio
                  position: 'relative',
                  bgcolor: '#000',
                  overflow: 'hidden',
                  borderRadius: 1,
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                }}
              >
                {/* Inner Content (Grid overlay inside 100% position) */}
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex' }}>
                  
                  {/* Main Media Panel (92% width) */}
                  <Box sx={{ flex: 9.2, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
                    {previewUrl || existingMediaUrl ? (
                      // Se for vídeo
                      (file && file.type.startsWith('video')) || (!file && existingMediaType === 'VIDEO') ? (
                        <SmartVideoPlayer 
                          key={previewUrl || existingMediaUrl}
                          src={previewUrl || existingMediaUrl}
                          autoPlay
                          muted
                          playsInline
                          showReplayButton={true}
                        />
                      ) : (
                        // Imagem
                        <Box 
                          component="img" 
                          src={previewUrl || existingMediaUrl} 
                          sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      )
                    ) : (
                      // Sem mídia - placeholder
                      <Box sx={{ textAlign: 'center', color: '#666', p: 2 }}>
                        <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mb: 1 }}>
                          Nenhuma mídia selecionada.
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, fontSize: '0.65rem' }}>
                          Adicione um arquivo .mp4 ou imagem para visualizar a simulação.
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* L-Bar Panel (8% width) */}
                  <Box sx={{ 
                    flex: 0.8, 
                    bgcolor: '#003B67', 
                    color: '#d3d3d3', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '1px solid #068dbd',
                    p: 0.5,
                    boxSizing: 'border-box'
                  }}>
                    {/* Logo HED */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 0.5, width: '100%' }}>
                      <Box 
                        component="img"
                        src={logoHed}
                        alt="Hospital"
                        sx={{ width: '100%', maxWidth: '35px', height: 'auto', objectFit: 'contain' }}
                      />
                    </Box>

                    {/* Relógio Simulado */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 10, color: '#068dbd', mb: 0.2 }} />
                      <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.45rem', lineHeight: 1 }}>
                        {simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>

                    {/* Dicas de Saúde */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 0.5, textAlign: 'center', width: '100%' }}>
                      <FavoriteIcon sx={{ color: '#068dbd', mb: 0.2, fontSize: 8 }} />
                      <Typography sx={{ fontWeight: 500, lineHeight: 1.1, fontSize: '0.22rem', scale: '0.9', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {DICAS_SAUDE[dicaIndex]}
                      </Typography>
                    </Box>
                  </Box>

                </Box>
              </Box>
              
              {/* TV Stand Base Support */}
              <Box 
                sx={{
                  width: '40px',
                  height: '10px',
                  bgcolor: '#1a1a1a',
                  mx: 'auto',
                  mt: 0,
                  borderBottom: '2px solid #2d2d2d'
                }}
              />
              <Box 
                sx={{
                  width: '90px',
                  height: '4px',
                  bgcolor: '#111',
                  mx: 'auto',
                  borderRadius: '3px 3px 0 0'
                }}
              />
            </Box>
            
            {/* Informações Auxiliares do Preview */}
            <Card sx={{ mt: 3, borderRadius: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main', bgcolor: 'action.hover' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="body2" fontWeight="bold">
                  💡 Como funciona o efeito vertical?
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Caso envie um vídeo no formato vertical (Reels/TikTok), nosso reprodutor inteligente duplicará o vídeo em segundo plano aplicando um desfoque estético avançado. Isso evita faixas pretas e torna a exibição muito mais atraente!
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

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
