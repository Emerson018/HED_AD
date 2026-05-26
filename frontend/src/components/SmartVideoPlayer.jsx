import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';

/**
 * SmartVideoPlayer Component
 * 
 * Plays videos horizontal format naturally, while applying a beautiful blurred background
 * (Instagram/TikTok style blur effect) for vertical format or misaligned video aspect ratios.
 * Also keeps both foreground and background videos perfectly in sync and supports an optional
 * interactive Replay Button overlay when playback finishes.
 */
const SmartVideoPlayer = ({ 
  src, 
  onEnded, 
  onTimeUpdate,
  autoPlay = true, 
  muted = true, 
  playsInline = true,
  disableBackground = false,
  showReplayButton = false,
  playing = true,
  style = {}
}) => {
  const fgRef = useRef(null);
  const bgRef = useRef(null);
  const [hasEnded, setHasEnded] = useState(false);

  // Reset overlay state if video source changes
  useEffect(() => {
    setHasEnded(false);
  }, [src]);

  // Sync play/pause state of foreground video with playing prop
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    if (playing) {
      fg.play().catch(err => console.log("Foreground play interrupted:", err));
    } else {
      fg.pause();
    }
  }, [playing]);

  useEffect(() => {
    const fg = fgRef.current;
    const bg = bgRef.current;
    if (!fg) return;

    const handleLoadedMetadata = () => {
      if (bg) {
        bg.currentTime = fg.currentTime;
      }
    };

    const handlePlay = () => {
      if (bg) {
        bg.play().catch(err => console.log("Background video play interrupted:", err));
      }
    };

    const handlePause = () => {
      if (bg) {
        bg.pause();
      }
    };

    const handleTimeUpdate = () => {
      if (bg && Math.abs(bg.currentTime - fg.currentTime) > 1.5) {
        bg.currentTime = fg.currentTime;
      }
    };

    const handleSeeking = () => {
      if (bg) {
        bg.currentTime = fg.currentTime;
      }
    };

    fg.addEventListener('loadedmetadata', handleLoadedMetadata);
    fg.addEventListener('play', handlePlay);
    fg.addEventListener('pause', handlePause);
    fg.addEventListener('timeupdate', handleTimeUpdate);
    fg.addEventListener('seeking', handleSeeking);

    // In case the foreground autoplay is triggered before effect runs
    if (!fg.paused && bg && bg.paused) {
      bg.play().catch(err => console.log("Background play started manually:", err));
    }

    return () => {
      fg.removeEventListener('loadedmetadata', handleLoadedMetadata);
      fg.removeEventListener('play', handlePlay);
      fg.removeEventListener('pause', handlePause);
      fg.removeEventListener('timeupdate', handleTimeUpdate);
      fg.removeEventListener('seeking', handleSeeking);
    };
  }, [src, disableBackground]);

  const handleEnded = () => {
    if (showReplayButton) {
      setHasEnded(true);
    }
    if (onEnded) {
      onEnded();
    }
  };

  const handleReplay = (e) => {
    e.stopPropagation();
    setHasEnded(false);
    if (fgRef.current) {
      fgRef.current.currentTime = 0;
      fgRef.current.play().catch(err => console.log("Replay failed:", err));
    }
  };

  return (
    <Box 
      className="smart-video-player"
      sx={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        bgcolor: '#000',
        borderRadius: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style 
      }}
    >
      {/* Background Video (Instagram Blurred Duplicate) */}
      {!disableBackground && src && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            filter: 'blur(20px) brightness(0.4)',
            transform: 'scale(1.15)', // Smooths out white blurred edges
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <video
            ref={bgRef}
            src={src}
            muted
            playsInline
            loop
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </Box>
      )}

      {/* Foreground Video (Main Video) */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <video
          ref={fgRef}
          src={src}
          autoPlay={autoPlay}
          muted={muted}
          playsInline={playsInline}
          onEnded={handleEnded}
          onTimeUpdate={onTimeUpdate ? (e) => onTimeUpdate(e.target.currentTime, e.target.duration) : undefined}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
        />
      </Box>

      {/* Glassmorphic Replay Overlay */}
      {hasEnded && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 15,
            bgcolor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1.5,
            animation: 'fadeIn 0.25s ease-in-out',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 }
            }
          }}
        >
          <IconButton
            onClick={handleReplay}
            sx={{
              color: '#fff',
              bgcolor: 'primary.main',
              width: 50,
              height: 50,
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              transform: 'scale(1)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'scale(1.15)'
              }
            }}
          >
            <ReplayIcon sx={{ fontSize: 28 }} />
          </IconButton>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#fff', 
              fontWeight: 'bold', 
              letterSpacing: 0.5,
              textShadow: '0 1px 3px rgba(0,0,0,0.8)' 
            }}
          >
            Reproduzir Novamente
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SmartVideoPlayer;
