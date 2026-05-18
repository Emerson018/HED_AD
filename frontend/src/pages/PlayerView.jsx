import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Box, Typography, CircularProgress } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteIcon from '@mui/icons-material/Favorite';
import logoHed from '../assets/logo-hed.png';

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
  const isClean = searchParams.get('clean') === 'true' || searchParams.get('lbar') === 'false';
  const fitMode = searchParams.get('fit') || 'cover';

  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cachedUrls, setCachedUrls] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Widgets State
  const [time, setTime] = useState(new Date());
  const [dicaIndex, setDicaIndex] = useState(0);

  const videoRef = useRef(null);

  // Widget: Clock & Dicas
  useEffect(() => {
    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    const dicaInterval = setInterval(() => {
      setDicaIndex((prev) => (prev + 1) % DICAS_SAUDE.length);
    }, 15000); // Troca de dica a cada 15 segundos

    return () => {
      clearInterval(clockInterval);
      clearInterval(dicaInterval);
    };
  }, []);

  // Fetch Playlist and Preload Media
  useEffect(() => {
    const initPlayer = async () => {
      try {
        const forcedTurno = searchParams.get('turno');
        const playlistUrl = forcedTurno ? `tv/playlist/?turno=${forcedTurno}` : 'tv/playlist/';
        const res = await api.get(playlistUrl);
        const campanhas = res.data;
        
        if (campanhas.length === 0) {
          setPlaylist([]);
          setLoading(false);
          return;
        }

        setPlaylist(campanhas);
        setLoading(false); // Liberar exibição da TV imediatamente!

        // Preload das mídias em Background (Paralelo e Não Bloqueante)
        campanhas.forEach(async (c) => {
          if (c.midias && c.midias.length > 0) {
            const url = c.midias[0].arquivo_url;
            try {
              const fileRes = await fetch(url);
              const blob = await fileRes.blob();
              const blobUrl = URL.createObjectURL(blob);
              setCachedUrls((prev) => ({
                ...prev,
                [url]: blobUrl
              }));
              console.log("Cached successfully in background:", url);
            } catch (err) {
              console.warn("Falha de CORS/Rede ao pré-carregar mídia. Usando URL direta:", url, err);
              // Fallback automático é a URL direta (supabse) no render
            }
          }
        });

      } catch (error) {
        console.error("Erro ao buscar playlist", error);
        // Tenta de novo em 10 segundos se a API cair
        setTimeout(initPlayer, 10000);
      }
    };

    initPlayer();
  }, [token]);

  const handleNext = async () => {
    if (playlist.length === 0) return;
    const campanhaAtual = playlist[currentIndex];
    
    // Proof of Play: Log de exibição
    try {
      await api.post('player/log/', { 
        campanha_id: campanhaAtual.id 
      });
      console.log("Log de exibição gravado para:", campanhaAtual.nome);
    } catch (err) {
      console.error("Falha ao gravar log", err);
    }

    setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  };

  // Efeito para tratar imagens (fallback de tempo)
  useEffect(() => {
    if (playlist.length === 0 || loading) return;
    
    const currentMidia = playlist[currentIndex].midias?.[0];
    if (currentMidia && currentMidia.tipo === 'IMAGEM') {
      const duracao = playlist[currentIndex].duracao || 15;
      const timer = setTimeout(handleNext, duracao * 1000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, playlist, loading]);

  if (loading) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', bgcolor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress color="secondary" />
      </Box>
    );
  }

  if (playlist.length === 0) {
    return (
      <Box sx={{ width: '100vw', height: '100vh', bgcolor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
        <Typography variant="h4">Aguardando Campanhas...</Typography>
      </Box>
    );
  }

  const currentCampanha = playlist[currentIndex];
  const midiaOriginal = currentCampanha.midias?.[0]?.arquivo_url;
  const isVideo = currentCampanha.midias?.[0]?.tipo === 'VIDEO';
  const midiaCache = cachedUrls[midiaOriginal] || midiaOriginal;

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden', bgcolor: '#000' }}>
      
      {/* ÁREA PRINCIPAL (92% ou 100%) */}
      <Box sx={{ flex: isClean ? 10 : 9.2, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
        {isVideo ? (
          <video 
            key={currentCampanha.id}
            ref={videoRef}
            src={midiaCache}
            autoPlay
            muted
            playsInline
            onEnded={handleNext}
            style={{ width: '100%', height: '100%', objectFit: fitMode }}
          />
        ) : (
          <img 
            src={midiaCache} 
            alt={currentCampanha.nome}
            style={{ width: '100%', height: '100%', objectFit: fitMode }} 
          />
        )}
      </Box>

      {/* L-BAR (8% - Simbólico) */}
      {!isClean && (
        <Box sx={{ 
          flex: 0.8, 
          bgcolor: '#003B67', 
          color: '#d3d3d3', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '3px solid #068dbd',
          p: 1.5,
          boxSizing: 'border-box'
        }}>
          
          {/* Logo HED */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pt: 1, width: '100%' }}>
            <Box 
              component="img"
              src={logoHed}
              alt="Hospital Ernesto Dornelles"
              sx={{ width: '100%', maxWidth: '110px', height: 'auto', objectFit: 'contain' }}
            />
          </Box>

          {/* Widget: Relógio */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 2 }}>
            <AccessTimeIcon sx={{ fontSize: 24, color: '#068dbd', mb: 0.5 }} />
            <Typography sx={{ color: '#fff', fontWeight: 'bold', fontSize: '1.4rem', lineHeight: 1 }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
            <Typography sx={{ color: '#d3d3d3', fontSize: '0.7rem', opacity: 0.8, mt: 0.5 }}>
              {time.toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
            </Typography>
          </Box>

          {/* Widget: Dicas de Saúde */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 1, textAlign: 'center', width: '100%' }}>
            <FavoriteIcon sx={{ color: '#068dbd', mb: 0.5, fontSize: 20 }} />
            <Typography sx={{ fontWeight: 500, lineHeight: 1.3, fontSize: '0.7rem' }}>
              {DICAS_SAUDE[dicaIndex]}
            </Typography>
          </Box>

        </Box>
      )}
    </Box>
  );
};

export default PlayerView;
