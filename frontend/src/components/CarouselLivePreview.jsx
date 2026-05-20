import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SmartVideoPlayer from './SmartVideoPlayer';

const CarouselLivePreview = ({ campanhas, turno }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlist, setPlaylist] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // Filtra campanhas aprovadas para o turno selecionado
    const filtered = campanhas.filter(c => 
      (c.status === 'APROVADA' || c.status === 'ATIVA') && 
      (c.turnos && c.turnos.includes(turno))
    );
    
    // Separa comerciais de institucionais
    const comerciais = filtered.filter(c => !c.is_institucional);
    const institucionais = filtered.filter(c => c.is_institucional);
    
    const tempo_ocupado = comerciais.reduce((acc, curr) => acc + (curr.duracao || 0), 0);
    const tempo_livre = Math.max(0, 300 - tempo_ocupado);
    
    const institucionais_selecionados = [];
    let tempo_acumulado_institucional = 0;
    for (const c of institucionais) {
      if (tempo_acumulado_institucional + (c.duracao || 0) <= tempo_livre) {
        institucionais_selecionados.push(c);
        tempo_acumulado_institucional += (c.duracao || 0);
      }
    }
    
    setPlaylist([...comerciais, ...institucionais_selecionados]);
    setCurrentIndex(0);
  }, [campanhas, turno]);

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
      {/* Mini Player */}
      <Box sx={{ position: 'relative', pt: '56.25%', bgcolor: '#000' }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        </Box>

        {/* Overlay Info */}
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: '#fff' }}>
          <Typography variant="subtitle2" fontWeight="bold">{currentCampanha.nome}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>{currentCampanha.parceiro_nome} • {currentCampanha.duracao}s</Typography>
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
