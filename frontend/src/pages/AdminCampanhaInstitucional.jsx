import React, { useState, useEffect } from 'react';
import { uploadMidiaWithProgress } from '../utils/supabaseClient';
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
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogContent,
  LinearProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TvIcon from '@mui/icons-material/Tv';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { useNavigate } from 'react-router-dom';
import logoHed from '../assets/logo-hed.png';
import SmartVideoPlayer from '../components/SmartVideoPlayer';

const AdminCampanhaInstitucional = () => {
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [duracao, setDuracao] = useState(15);
  const [turnos, setTurnos] = useState(['MANHA', 'TARDE', 'NOITE', 'MADRUGADA']);
  const [categoria, setCategoria] = useState('Institucional');
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 365);
    return d.toISOString().split('T')[0];
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [diasSemana, setDiasSemana] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [tvs, setTvs] = useState(['sala_espera', 'recepcao', 'sala_cirurgia', 'corredor']);
  const [expandedPreview, setExpandedPreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const localUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(localUrl);

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
      setDuracao(15);
    }
  };

  const handleCreateCampanha = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Selecione um arquivo de mídia.");
      return;
    }
    if (!nomeCampanha) {
      alert("Preencha o nome da campanha.");
      return;
    }

    setLoading(true);
    try {
      showMessage("Enviando mídia...", "info");
      setUploadProgress(0);
      const publicUrl = await uploadMidiaWithProgress(file, (percent) => {
        setUploadProgress(percent);
      });

      if (!publicUrl) {
        throw new Error("Não foi possível obter a URL pública do arquivo.");
      }
      setUploadProgress(100);

      showMessage("Criando campanha institucional...", "info");
      const campanhaResponse = await api.post('campanhas/', {
        nome: nomeCampanha,
        status: 'APROVADA',
        duracao: parseInt(duracao),
        turnos: turnos,
        categoria: categoria,
        data_inicio: dataInicio,
        data_fim: dataFim,
        dias_semana: diasSemana,
        is_institucional: true,
        tvs: tvs,
      });

      const campanhaId = campanhaResponse.data.id;

      showMessage("Salvando mídia...", "info");
      const fileType = file.type.startsWith('video') ? 'VIDEO' : 'IMAGEM';
      await api.post('midias/', {
        campanha: campanhaId,
        tipo: fileType,
        arquivo_url: publicUrl,
      });

      showMessage("Campanha institucional criada com sucesso!", "success");
      setNomeCampanha('');
      setFile(null);

      setTimeout(() => {
        navigate('/admin');
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
        <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocalHospitalIcon fontSize="large" color="primary" />
          Nova Campanha Institucional
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Formulário (Coluna Esquerda) */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary" sx={{ fontWeight: 'bold' }}>
                Configurações da Campanha Institucional
              </Typography>
              <Box component="form" onSubmit={handleCreateCampanha} sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
                <TextField
                  label="Nome da Campanha"
                  variant="outlined"
                  fullWidth
                  value={nomeCampanha}
                  onChange={(e) => {
                    if (e.target.value.length <= 20) {
                      setNomeCampanha(e.target.value);
                    }
                  }}
                  required
                  inputProps={{ maxLength: 20 }}
                  helperText={`${nomeCampanha.length}/20 caracteres`}
                  placeholder="Ex: Dicas de Saúde"
                />

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
                      display: 'flex', flexWrap: 'wrap', gap: 1,
                      '& .MuiToggleButton-root': {
                        flex: 1, minWidth: '100px', borderRadius: '12px !important',
                        border: '1px solid !important', borderColor: 'divider',
                        fontWeight: 'bold', textTransform: 'none', py: 1.5,
                        '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }
                      }
                    }}
                  >
                    <ToggleButton value="MANHA" aria-label="manhã">Manhã (06-12h)</ToggleButton>
                    <ToggleButton value="TARDE" aria-label="tarde">Tarde (12-18h)</ToggleButton>
                    <ToggleButton value="NOITE" aria-label="noite">Noite (18-00h)</ToggleButton>
                    <ToggleButton value="MADRUGADA" aria-label="madrugada">Madrugada (00-06h)</ToggleButton>
                  </ToggleButtonGroup>
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

                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Dias da Semana para Exibição
                  </Typography>
                  <ToggleButtonGroup
                    value={diasSemana}
                    onChange={(e, newDays) => { if (newDays.length > 0) setDiasSemana(newDays); }}
                    exclusive={false}
                    aria-label="dias da semana"
                    size="small"
                    sx={{ 
                      gap: 1, flexWrap: 'wrap',
                      '& .MuiToggleButton-root': {
                        borderRadius: '50% !important', width: 40, height: 40,
                        border: '1px solid !important', borderColor: 'divider', fontWeight: 'bold',
                        '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }
                      }
                    }}
                  >
                    <ToggleButton value={0} aria-label="segunda">S</ToggleButton>
                    <ToggleButton value={1} aria-label="terça">T</ToggleButton>
                    <ToggleButton value={2} aria-label="quarta">Q</ToggleButton>
                    <ToggleButton value={3} aria-label="quinta">Q</ToggleButton>
                    <ToggleButton value={4} aria-label="sexta">S</ToggleButton>
                    <ToggleButton value={5} aria-label="sábado">Sá</ToggleButton>
                    <ToggleButton value={6} aria-label="domingo">Do</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                    Televisões para Exibição (Selecione uma ou mais)
                  </Typography>
                  <ToggleButtonGroup
                    value={tvs}
                    onChange={(e, val) => val.length > 0 && setTvs(val)}
                    exclusive={false}
                    aria-label="televisões de exibição"
                    fullWidth
                    sx={{ 
                      display: 'flex', flexWrap: 'wrap', gap: 1,
                      '& .MuiToggleButton-root': {
                        flex: 1, minWidth: '120px', borderRadius: '12px !important',
                        border: '1px solid !important', borderColor: 'divider',
                        fontWeight: 'bold', textTransform: 'none', py: 1.25,
                        '&.Mui-selected': { bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }
                      }
                    }}
                  >
                    <ToggleButton value="sala_espera" aria-label="sala de espera">Sala de Espera</ToggleButton>
                    <ToggleButton value="recepcao" aria-label="recepção">Recepção</ToggleButton>
                    <ToggleButton value="sala_cirurgia" aria-label="sala de cirurgia">Sala de Cirurgia</ToggleButton>
                    <ToggleButton value="corredor" aria-label="corredor">Corredor Principal</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <TextField
                  select
                  label="Categoria"
                  variant="outlined"
                  fullWidth
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <MenuItem value="Institucional">Institucional</MenuItem>
                  <MenuItem value="Saúde">Saúde</MenuItem>
                  <MenuItem value="Eventos">Eventos</MenuItem>
                  <MenuItem value="Entretenimento">Entretenimento</MenuItem>
                  <MenuItem value="Outros">Outros</MenuItem>
                </TextField>

                <Box sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'action.hover', position: 'relative' }}>
                  {/* Overlay de loading durante upload */}
                  {loading && (
                    <Box sx={{ 
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                      bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 2, zIndex: 10,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5
                    }}>
                      <CircularProgress size={40} sx={{ color: '#fff' }} />
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 'bold' }}>
                        {uploadProgress > 0 && uploadProgress < 100 
                          ? `Enviando... ${uploadProgress}%` 
                          : uploadProgress === 100 
                            ? 'Salvando campanha...' 
                            : 'Processando...'}
                      </Typography>
                    </Box>
                  )}
                  <input
                    accept="video/mp4,image/*"
                    style={{ display: 'none' }}
                    id="raised-button-file"
                    type="file"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  <label htmlFor="raised-button-file">
                    <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} disabled={loading}>
                      Selecionar Mídia
                    </Button>
                  </label>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Máximo 10MB (A duração real do vídeo será usada)
                  </Typography>
                  {file && (
                    <Typography sx={{ mt: 1, fontWeight: 'bold', color: 'primary.main' }}>
                      Arquivo: {file.name}
                    </Typography>
                  )}
                  {file && (
                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      <AccessTimeIcon color="primary" />
                      <Typography variant="body2" fontWeight="bold">
                        Duração: {duracao} {duracao === 1 ? 'segundo' : 'segundos'}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LocalHospitalIcon />}
                  sx={{ py: 1.5, fontWeight: 'bold' }}
                >
                  {loading ? 'Processando...' : 'Criar Campanha Institucional'}
                </Button>

                {/* Barra de progresso do upload */}
                {loading && uploadProgress > 0 && uploadProgress < 100 && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" fontWeight="bold" color="primary">
                        Enviando mídia...
                      </Typography>
                      <Typography variant="caption" fontWeight="bold" color="primary">
                        {uploadProgress}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
                {loading && uploadProgress === 100 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" fontWeight="bold" color="success.main">
                      ✓ Upload concluído! Salvando campanha...
                    </Typography>
                    <LinearProgress sx={{ height: 8, borderRadius: 4, mt: 0.5 }} />
                  </Box>
                )}
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
              {previewUrl && (
                <IconButton 
                  onClick={() => setExpandedPreview(true)} 
                  size="small" 
                  color="primary"
                  sx={{ ml: 'auto' }}
                  title="Expandir visualização"
                >
                  <FullscreenIcon />
                </IconButton>
              )}
            </Typography>
            
            <Box sx={{ width: '100%', bgcolor: '#1a1a1a', borderRadius: 4, p: 1.5, boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.1)', border: '4px solid #2d2d2d', position: 'relative' }}>
              <Box sx={{ width: '100%', pt: '56.25%', position: 'relative', bgcolor: '#000', overflow: 'hidden', borderRadius: 1, boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)' }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex' }}>
                  
                  {/* Main Media Panel */}
                  <Box sx={{ flex: 9.2, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
                    {previewUrl ? (
                      file && file.type.startsWith('video') ? (
                        <SmartVideoPlayer 
                          key={previewUrl}
                          src={previewUrl}
                          autoPlay
                          muted
                          playsInline
                          showReplayButton={true}
                        />
                      ) : (
                        <Box component="img" src={previewUrl} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      )
                    ) : (
                      <Box sx={{ textAlign: 'center', color: '#666', p: 2 }}>
                        <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mb: 1 }}>
                          Nenhuma mídia selecionada.
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, fontSize: '0.65rem' }}>
                          Adicione um arquivo .mp4 ou imagem para visualizar.
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* L-Bar Panel */}
                  <Box sx={{ flex: 0.8, bgcolor: '#003B67', color: '#d3d3d3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', borderLeft: '1px solid #068dbd', p: 0.5, boxSizing: 'border-box' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 0.5, width: '100%' }}>
                      <Box component="img" src={logoHed} alt="Hospital" sx={{ width: '100%', maxWidth: '35px', height: 'auto', objectFit: 'contain' }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 1 }}>
                      <AccessTimeIcon sx={{ fontSize: 10, color: '#068dbd', mb: 0.2 }} />
                      <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.45rem', lineHeight: 1 }}>
                        {simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 0.5, textAlign: 'center', width: '100%' }}>
                      <FavoriteIcon sx={{ color: '#068dbd', mb: 0.2, fontSize: 8 }} />
                      <Typography sx={{ fontWeight: 500, lineHeight: 1.1, fontSize: '0.22rem', scale: '0.9', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {DICAS_SAUDE[dicaIndex]}
                      </Typography>
                    </Box>
                  </Box>

                </Box>
              </Box>
              <Box sx={{ width: '40px', height: '10px', bgcolor: '#1a1a1a', mx: 'auto', mt: 0, borderBottom: '2px solid #2d2d2d' }} />
              <Box sx={{ width: '90px', height: '4px', bgcolor: '#111', mx: 'auto', borderRadius: '3px 3px 0 0' }} />
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Dialog de visualização expandida com máscara */}
      <Dialog
        open={expandedPreview}
        onClose={() => setExpandedPreview(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, bgcolor: '#000', overflow: 'hidden' }
        }}
      >
        <DialogContent sx={{ p: 2 }}>
          <Box sx={{ width: '100%', pt: '56.25%', position: 'relative', bgcolor: '#000', overflow: 'hidden', borderRadius: 1 }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex' }}>
              {/* Área principal de mídia */}
              <Box sx={{ flex: 9.2, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
                {previewUrl ? (
                  file && file.type.startsWith('video') ? (
                    <SmartVideoPlayer 
                      key={`expanded-${previewUrl}`}
                      src={previewUrl}
                      autoPlay
                      muted
                      playsInline
                      showReplayButton={true}
                    />
                  ) : (
                    <Box component="img" src={previewUrl} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  )
                ) : null}
              </Box>
              {/* L-Bar Panel (máscara) */}
              <Box sx={{ width: '60px', bgcolor: '#003B67', color: '#d3d3d3', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', borderLeft: '2px solid #068dbd', py: 1.5, px: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  <Box component="img" src={logoHed} alt="Hospital" sx={{ width: '80%', maxWidth: '40px', height: 'auto', objectFit: 'contain' }} />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ fontSize: 16, color: '#068dbd', mb: 0.3 }} />
                  <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.7rem', lineHeight: 1 }}>
                    {simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', px: 0.3 }}>
                  <FavoriteIcon sx={{ color: '#068dbd', mb: 0.3, fontSize: 14 }} />
                  <Typography sx={{ fontWeight: 500, lineHeight: 1.2, fontSize: '0.55rem', color: '#d3d3d3', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {DICAS_SAUDE[dicaIndex]}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

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

export default AdminCampanhaInstitucional;
