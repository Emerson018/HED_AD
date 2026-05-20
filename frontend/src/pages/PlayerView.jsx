import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Box, Typography, CircularProgress, LinearProgress } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteIcon from '@mui/icons-material/Favorite';
import logoHed from '../assets/logo-hed.png';
import SmartVideoPlayer from '../components/SmartVideoPlayer';

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
  const isClean = false; // Forçado em produção: sempre manter o player institucional com a máscara
  const fitMode = searchParams.get('fit') || 'cover';

  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [cachingProgress, setCachingProgress] = useState(0);

  // Efeito para simular o progresso do loading de 1.5s
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
      }, 30); // 30ms * 50 passos = 1.5 segundos
      return () => clearInterval(timer);
    }
  }, [playlist.length, isReady]);
  
  // Widgets State
  const [time, setTime] = useState(new Date());
  const [dicaIndex, setDicaIndex] = useState(0);


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

  const playlistRef = useRef(playlist);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const fetchPlaylist = async (silent = false) => {
    try {
      const forcedTurno = searchParams.get('turno');
      const playlistUrl = forcedTurno ? `tv/playlist/?turno=${forcedTurno}` : 'tv/playlist/';
      const res = await api.get(playlistUrl);
      const newCampanhas = res.data;
      
      if (newCampanhas.length === 0) {
        setPlaylist([]);
        return;
      }

      const oldIds = playlistRef.current.map(c => c.id).join(',');
      const newIds = newCampanhas.map(c => c.id).join(',');

      // Se houver alteração ou for a primeira carga
      if (oldIds !== newIds) {
        console.log("Grade de exibição atualizada!");
        if (!silent) {
          setIsReady(false);
        }
        setPlaylist(newCampanhas);
        
        if (playlistRef.current.length === 0 || currentIndexRef.current >= newCampanhas.length) {
          setCurrentIndex(0);
        }
      }

    } catch (error) {
      console.error("Erro ao buscar playlist", error);
      if (!silent) {
        setTimeout(() => fetchPlaylist(false), 10000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Primeira busca ao carregar a tela
  useEffect(() => {
    fetchPlaylist(false);
  }, [token]);

  // Polling silencioso caso o carrossel esteja vazio
  useEffect(() => {
    if (playlist.length === 0) {
      const interval = setInterval(() => {
        fetchPlaylist(true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [playlist.length]);

  const handleNext = async () => {
    const currentPlaylist = playlistRef.current;
    const currIndex = currentIndexRef.current;

    if (currentPlaylist.length === 0) return;
    const campanhaAtual = currentPlaylist[currIndex];
    
    // Proof of Play: Log de exibição
    try {
      await api.post('player/log/', { 
        campanha_id: campanhaAtual.id 
      });
      console.log("Log de exibição gravado para:", campanhaAtual.nome);
    } catch (err) {
      console.error("Falha ao gravar log", err);
    }

    // Se terminamos a volta do carrossel (ciclo completo), fazemos fetch silencioso
    if (currIndex === currentPlaylist.length - 1) {
      console.log("Ciclo completo do carrossel! Atualizando playlist em background...");
      fetchPlaylist(true);
    }

    setCycleCount((prev) => prev + 1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % currentPlaylist.length);
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

  if (loading || (!isReady && playlist.length > 0)) {
    return (
      <Box sx={{ 
        width: '100vw', 
        height: '100vh', 
        bgcolor: '#000', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        color: '#fff',
        gap: 3
      }}>
        <CircularProgress color="primary" />
        <Box sx={{ width: '320px', textAlign: 'center' }}>
          <LinearProgress 
            variant="determinate" 
            value={cachingProgress} 
            sx={{ 
              height: 8, 
              borderRadius: 4, 
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: 'primary.main'
              }
            }} 
          />
          <Typography variant="body2" sx={{ mt: 1.5, color: 'rgba(255, 255, 255, 0.5)' }}>
            Pré-carregando mídias... {cachingProgress}%
          </Typography>
        </Box>
      </Box>
    );
  }

  if (playlist.length === 0) {
    return (
      <Box sx={{ 
        width: '100vw', 
        height: '100vh', 
        bgcolor: '#000', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        color: '#fff',
        gap: 3
      }}>
        <Typography variant="h4" fontWeight="bold">Aguardando Campanhas...</Typography>
        <Box sx={{ width: '320px', textAlign: 'center' }}>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ 
              height: 8, 
              borderRadius: 4, 
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: 'primary.main'
              }
            }} 
          />
          <Typography variant="body2" sx={{ mt: 1.5, color: 'rgba(255, 255, 255, 0.5)' }}>
            Verificando novos envios no servidor...
          </Typography>
        </Box>
      </Box>
    );
  }

  const isEven = currentIndex % 2 === 0;

  // Determina as campanhas de cada slot
  // Slot 1 cuida dos índices pares como ativo, e ímpares como background
  // Slot 2 cuida dos índices ímpares como ativo, e pares como background
  const slot1Campanha = isEven ? playlist[currentIndex] : playlist[(currentIndex + 1) % playlist.length];
  const slot2Campanha = isEven ? playlist[(currentIndex + 1) % playlist.length] : playlist[currentIndex];

  const renderSlot = (campanha, isActive) => {
    if (!campanha) return null;
    const midia = campanha.midias?.[0];
    const isVideo = midia?.tipo === 'VIDEO';
    
    // Se a playlist tem apenas 1 item, usamos o cycleCount para forçar o reinício do vídeo
    const playerKey = playlist.length === 1 
      ? `${midia?.arquivo_url}-${cycleCount}` 
      : midia?.arquivo_url;

    return (
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          opacity: isActive ? 1 : 0, 
          pointerEvents: isActive ? 'auto' : 'none',
          zIndex: isActive ? 2 : 1,
          transition: 'opacity 0.5s ease-in-out' // Transição crossfade suave de meio segundo
        }}
      >
        {isVideo ? (
          <SmartVideoPlayer 
            key={playerKey}
            src={midia?.arquivo_url}
            autoPlay={isActive}
            playing={isActive}
            muted
            playsInline
            onEnded={isActive ? handleNext : undefined}
            disableBackground={false}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <img 
            src={midia?.arquivo_url} 
            alt={campanha.nome}
            style={{ width: '100%', height: '100%', objectFit: fitMode }} 
          />
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden', bgcolor: '#000' }}>
      
      {/* Preload nativo em background usando cache HTTP do navegador */}
      <Box sx={{ display: 'none', width: 0, height: 0 }} aria-hidden="true">
        {playlist.map((c) => (
          c.midias?.[0]?.tipo === 'VIDEO' && (
            <video
              key={`preload-${c.id}`}
              src={c.midias[0].arquivo_url}
              preload="auto"
              muted
            />
          )
        ))}
      </Box>

      {/* ÁREA PRINCIPAL (92% ou 100%) */}
      <Box sx={{ flex: isClean ? 10 : 9.2, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
        {renderSlot(slot1Campanha, isEven)}
        {renderSlot(slot2Campanha, !isEven)}
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
