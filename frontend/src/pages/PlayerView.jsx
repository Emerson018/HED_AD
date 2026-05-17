import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, CircularProgress } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteIcon from '@mui/icons-material/Favorite';

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
  const fitMode = searchParams.get('fit') || 'contain';

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
        // GET na API (Para MVP não estamos forçando token Auth na Header, pois a TV não faz login normal)
        // O Endpoint TVPlaylistView aceita AllowAny.
        const res = await axios.get('http://127.0.0.1:8000/api/tv/playlist/');
        const campanhas = res.data;
        
        if (campanhas.length === 0) {
          setLoading(false);
          return; // Fica na tela preta / aguardando
        }

        setPlaylist(campanhas);

        // Preload das mídias em Background
        const cache = {};
        for (const c of campanhas) {
          if (c.midias && c.midias.length > 0) {
            const url = c.midias[0].arquivo_url;
            try {
              const fileRes = await fetch(url);
              const blob = await fileRes.blob();
              cache[url] = URL.createObjectURL(blob);
              console.log("Cached:", url);
            } catch (err) {
              console.error("Falha ao cachear", url, err);
              cache[url] = url; // Fallback
            }
          }
        }
        setCachedUrls(cache);
        setLoading(false);

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
      await axios.post('http://127.0.0.1:8000/api/player/log/', { 
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
      
      {/* ÁREA PRINCIPAL (80% ou 100%) */}
      <Box sx={{ flex: isClean ? 10 : 8, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
        {isVideo ? (
          <video 
            ref={videoRef}
            src={midiaCache}
            autoPlay
            muted
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

      {/* L-BAR (20%) */}
      {!isClean && (
        <Box sx={{ 
          flex: 2, 
          bgcolor: '#003B67', 
          color: '#d3d3d3', 
          display: 'flex', 
          flexDirection: 'column',
          borderLeft: '4px solid #068dbd',
          p: 3
        }}>
          
          {/* Logo Placeholder */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', pt: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#fff', fontWeight: 'bold', mb: 0.5 }}>
                HOSPITAL
              </Typography>
              <Typography variant="subtitle2" sx={{ color: '#068dbd', letterSpacing: 2 }}>
                ERNESTO DORNELLES
              </Typography>
            </Box>
          </Box>

          {/* Widget: Relógio */}
          <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <AccessTimeIcon sx={{ fontSize: 40, color: '#068dbd', mb: 1 }} />
            <Typography variant="h3" sx={{ color: '#fff', fontWeight: 'bold' }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#d3d3d3' }}>
              {time.toLocaleDateString()}
            </Typography>
          </Box>

          {/* Widget: Dicas de Saúde */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', pb: 2, textAlign: 'center' }}>
            <FavoriteIcon sx={{ color: '#068dbd', mb: 1, fontSize: 32 }} />
            <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
              {DICAS_SAUDE[dicaIndex]}
            </Typography>
          </Box>

        </Box>
      )}
    </Box>
  );
};

export default PlayerView;
