import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, CircularProgress, LinearProgress } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteIcon from '@mui/icons-material/Favorite';
import logoHed from '../assets/logo-hed.png';
import SmartVideoPlayer from '../components/SmartVideoPlayer';

// API sem autenticação para o player da TV (AllowAny no backend)
const playerApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

const DICAS_SAUDE = [
  "Beba pelo menos 2 litros de água por dia.",
  "Lave as mãos com frequência para evitar infecções.",
  "Mantenha seus exames de rotina em dia.",
  "Pratique pelo menos 30 minutos de exercício físico diário.",
  "Uma boa noite de sono melhora sua imunidade."
];

const PlayerView = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();

  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [cachingProgress, setCachingProgress] = useState(0);

  // Widgets
  const [time, setTime] = useState(new Date());
  const [dicaIndex, setDicaIndex] = useState(0);

  // Refs para polling
  const playlistRef = useRef(playlist);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  // Loading animation (1.5s)
  useEffect(() => {
    if (playlist.length > 0 && !isReady) {
      setCachingProgress(0);
      const timer = setInterval(() => {
        setCachingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setIsReady(true);
            return 100;
          }
          return prev + 2;
        });
      }, 30);
      return () => clearInterval(timer);
    }
  }, [playlist.length, isReady]);

  // Clock & Dicas
  useEffect(() => {
    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    const dicaInterval = setInterval(() => {
      setDicaIndex((prev) => (prev + 1) % DICAS_SAUDE.length);
    }, 15000);
    return () => {
      clearInterval(clockInterval);
      clearInterval(dicaInterval);
    };
  }, []);

  // Fetch playlist (mesma lógica da API)
  const fetchPlaylist = async (silent = false) => {
    try {
      const forcedTurno = searchParams.get('turno');
      let url = `tv/playlist/?tv=${token}`;
      if (forcedTurno) url += `&turno=${forcedTurno}`;

      const res = await playerApi.get(url);
      const data = res.data;

      // Filtra campanhas sem mídia
      const validas = data.filter(c => c.midias && c.midias.length > 0 && c.midias[0].arquivo_url);

      if (validas.length === 0) {
        setPlaylist([]);
        return;
      }

      const oldIds = playlistRef.current.map(c => c.id).join(',');
      const newIds = validas.map(c => c.id).join(',');

      if (oldIds !== newIds) {
        if (!silent) setIsReady(false);
        setPlaylist(validas);
        if (playlistRef.current.length === 0 || currentIndexRef.current >= validas.length) {
          setCurrentIndex(0);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar playlist", error);
      if (!silent) setTimeout(() => fetchPlaylist(false), 10000);
    } finally {
      setLoading(false);
    }
  };

  // Primeira busca
  useEffect(() => { fetchPlaylist(false); }, [token]);

  // Polling quando vazio (15s)
  useEffect(() => {
    if (playlist.length === 0 && !loading) {
      const interval = setInterval(() => fetchPlaylist(true), 15000);
      return () => clearInterval(interval);
    }
  }, [playlist.length, loading]);

  // Polling quando rodando (60s)
  useEffect(() => {
    if (playlist.length > 0) {
      const interval = setInterval(() => fetchPlaylist(true), 60000);
      return () => clearInterval(interval);
    }
  }, [playlist.length]);

  // Avançar para próxima campanha (mesma lógica do CarouselLivePreview)
  const handleNext = () => {
    if (playlist.length === 0) return;

    // Log de exibição
    const campanha = playlist[currentIndex];
    playerApi.post('player/log/', { campanha_id: campanha.id }).catch(() => {});

    // Atualiza playlist no fim do ciclo
    if (currentIndex === playlist.length - 1) {
      fetchPlaylist(true);
    }

    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  // Fallback de tempo para imagens (mesma lógica do CarouselLivePreview)
  useEffect(() => {
    if (playlist.length === 0 || !isReady) return;

    const current = playlist[currentIndex];
    const midia = current.midias?.[0];

    if (midia && midia.tipo === 'IMAGEM') {
      const timer = setTimeout(handleNext, (current.duracao || 15) * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, playlist, isReady]);

  // === TELAS DE ESTADO ===

  // Loading inicial
  if (loading || (!isReady && playlist.length > 0)) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', bgcolor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', gap: 3 }}>
        <CircularProgress color="primary" />
        <Box sx={{ width: '320px', textAlign: 'center' }}>
          <LinearProgress
            variant="determinate"
            value={cachingProgress}
            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'primary.main' } }}
          />
          <Typography variant="body2" sx={{ mt: 1.5, color: 'rgba(255,255,255,0.5)' }}>
            Pré-carregando mídias... {cachingProgress}%
          </Typography>
        </Box>
      </Box>
    );
  }

  // Playlist vazia
  if (playlist.length === 0) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', bgcolor: '#000', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff', gap: 3 }}>
        <Typography variant="h4" fontWeight="bold">Aguardando Campanhas...</Typography>
        <Box sx={{ width: '320px', textAlign: 'center' }}>
          <LinearProgress
            variant="indeterminate"
            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'primary.main' } }}
          />
          <Typography variant="body2" sx={{ mt: 1.5, color: 'rgba(255,255,255,0.5)' }}>
            Nenhuma campanha aprovada para este turno. Verificando a cada 15s...
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, color: 'rgba(255,255,255,0.3)', display: 'block' }}>
            TV: {token}
          </Typography>
        </Box>
      </Box>
    );
  }

  // === PLAYER PRINCIPAL (mesma lógica do CarouselLivePreview) ===
  const currentCampanha = playlist[currentIndex];
  const midia = currentCampanha.midias?.[0];

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden', bgcolor: '#000' }}>

      {/* ÁREA PRINCIPAL DE MÍDIA */}
      <Box sx={{ flex: 1, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
        {midia?.tipo === 'VIDEO' ? (
          <SmartVideoPlayer
            key={midia.arquivo_url}
            src={midia.arquivo_url}
            autoPlay
            muted
            playsInline
            playing={true}
            onEnded={handleNext}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <img
            src={midia?.arquivo_url}
            alt={currentCampanha.nome}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
      </Box>

      {/* L-BAR LATERAL */}
      <Box sx={{
        width: '80px',
        bgcolor: '#003B67',
        color: '#d3d3d3',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: '3px solid #068dbd',
        py: 2,
        px: 0.5,
      }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Box component="img" src={logoHed} alt="HED" sx={{ width: '90%', maxWidth: '60px', height: 'auto' }} />
        </Box>

        {/* Relógio */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AccessTimeIcon sx={{ fontSize: 22, color: '#068dbd', mb: 0.5 }} />
          <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', lineHeight: 1 }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
          <Typography sx={{ color: '#d3d3d3', fontSize: '0.6rem', opacity: 0.8, mt: 0.3 }}>
            {time.toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
          </Typography>
        </Box>

        {/* Dicas de Saúde */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', px: 0.3 }}>
          <FavoriteIcon sx={{ color: '#068dbd', mb: 0.5, fontSize: 18 }} />
          <Typography sx={{ fontWeight: 500, lineHeight: 1.3, fontSize: '0.55rem', color: '#d3d3d3' }}>
            {DICAS_SAUDE[dicaIndex]}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PlayerView;
