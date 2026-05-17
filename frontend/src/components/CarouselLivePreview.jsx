import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';

const CarouselLivePreview = ({ campanhas, turno }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlist, setPlaylist] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // Filtra campanhas aprovadas para o turno selecionado (ou Integral)
    const filtered = campanhas.filter(c => 
      (c.status === 'APROVADA' || c.status === 'ATIVA') && 
      (c.turno === turno || c.turno === 'INTEGRAL')
    );
    setPlaylist(filtered);
    setCurrentIndex(0);
  }, [campanhas, turno]);

  const handleNext = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  useEffect(() => {
    if (!isPlaying || playlist.length === 0) return;

    const current = playlist[currentIndex];
    const timer = setTimeout(handleNext, (current.duracao || 15) * 1000);
    return () => clearTimeout(timer);
  }, [currentIndex, playlist, isPlaying]);

  if (playlist.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 4, border: '2px dashed', borderColor: 'divider' }}>
        <Typography color="textSecondary">Nenhuma campanha aprovada para o turno {turno}.</Typography>
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
            <video 
              key={midia.arquivo_url}
              src={midia.arquivo_url} 
              autoPlay 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
        <IconButton onClick={() => setIsPlaying(!isPlaying)} size="small" color="primary">
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <Typography variant="caption" fontWeight="bold">
          {currentIndex + 1} / {playlist.length}
        </Typography>
        <IconButton onClick={handleNext} size="small" color="primary">
          <SkipNextIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default CarouselLivePreview;
