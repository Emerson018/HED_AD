import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SmartVideoPlayer from './SmartVideoPlayer';
import logoHed from '../assets/logo-hed.png';

const DICAS_SAUDE = [
  "Beba pelo menos 2 litros de água por dia.",
  "Lave as mãos com frequência para evitar infecções.",
  "Mantenha seus exames de rotina em dia.",
  "Pratique pelo menos 30 minutos de exercício físico diário.",
  "Uma boa noite de sono melhora sua imunidade."
];

const CarouselLivePreview = ({ playlist = [], turno }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simulatedTime, setSimulatedTime] = useState(new Date());
  const [dicaIndex, setDicaIndex] = useState(0);

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
    setCurrentIndex(0);
  }, [playlist]);

  const handleNext = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  useEffect(() => {
    if (!isPlaying || playlist.length === 0) return;

    const current = playlist[currentIndex];
    const timer = setTimeout(handleNext, (current.duracao || 15) * 1000);
    return () => clearTimeout(timer);
  }, [currentIndex, playlist, isPlaying]);

  if (playlist.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 4, border: '2px dashed', borderColor: 'divider', width: '100%' }}>
        <Typography color="text.secondary">Nenhuma campanha aprovada para o turno {turno}.</Typography>
      </Paper>
    );
  }

  const currentCampanha = playlist[currentIndex];
  const midia = currentCampanha.midias?.[0];

  return (
    <Paper elevation={4} sx={{ width: '100%', overflow: 'hidden', borderRadius: 4, bgcolor: '#000', position: 'relative' }}>
      {/* Mini Player com L-Bar */}
      <Box sx={{ position: 'relative', pt: '56.25%', bgcolor: '#000' }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex' }}>
          
          {/* Área principal de mídia */}
          <Box sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
            {midia?.tipo === 'VIDEO' ? (
              <SmartVideoPlayer 
                key={midia.arquivo_url}
                src={midia.arquivo_url} 
                autoPlay 
                muted 
                playing={isPlaying}
                style={{ width: '100%', height: '100%' }}
                onEnded={handleNext}
              />
            ) : (
              <img src={midia?.arquivo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}

            {/* Overlay Info */}
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: '#fff' }}>
              <Typography variant="subtitle2" fontWeight="bold">{currentCampanha.nome}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{currentCampanha.parceiro_nome} • {currentCampanha.duracao}s</Typography>
            </Box>
          </Box>

          {/* L-Bar Panel (máscara lateral) */}
          <Box sx={{ 
            width: '60px', 
            bgcolor: '#003B67', 
            color: '#d3d3d3', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderLeft: '2px solid #068dbd',
            py: 1.5,
            px: 0.5,
            boxSizing: 'border-box'
          }}>
            {/* Logo HED */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <Box 
                component="img"
                src={logoHed}
                alt="Hospital"
                sx={{ width: '80%', maxWidth: '40px', height: 'auto', objectFit: 'contain' }}
              />
            </Box>

            {/* Relógio Simulado */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: '#068dbd', mb: 0.3 }} />
              <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '0.65rem', lineHeight: 1 }}>
                {simulatedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>

            {/* Dicas de Saúde */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', px: 0.3 }}>
              <FavoriteIcon sx={{ color: '#068dbd', mb: 0.3, fontSize: 14 }} />
              <Typography sx={{ 
                fontWeight: 500, 
                lineHeight: 1.2, 
                fontSize: '0.5rem', 
                color: '#d3d3d3',
                display: '-webkit-box', 
                WebkitLineClamp: 4, 
                WebkitBoxOrient: 'vertical', 
                overflow: 'hidden' 
              }}>
                {DICAS_SAUDE[dicaIndex]}
              </Typography>
            </Box>
          </Box>

        </Box>
      </Box>

      {/* Controls */}
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'background.paper' }}>
        <IconButton onClick={handlePrev} size="small" color="primary">
          <SkipPreviousIcon />
        </IconButton>
        <IconButton onClick={() => setIsPlaying(!isPlaying)} size="small" color="primary">
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <IconButton onClick={handleNext} size="small" color="primary">
          <SkipNextIcon />
        </IconButton>
        <Typography variant="caption" fontWeight="bold" sx={{ ml: 1 }}>
          {currentIndex + 1} / {playlist.length}
        </Typography>
      </Box>
    </Paper>
  );
};

export default CarouselLivePreview;
