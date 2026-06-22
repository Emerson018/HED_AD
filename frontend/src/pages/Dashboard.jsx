import React, { useState, useEffect, useMemo, useCallback, useId } from 'react';
import api from '../utils/api';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  MenuItem,
  TextField,
  Skeleton,
  Paper,
  alpha,
  useTheme,
  Fade,
  Grow,
  Tooltip,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CampaignIcon from '@mui/icons-material/Campaign';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// Helper: format date to YYYY-MM-DD for input[type="date"]
const formatDateInput = (date) => date.toISOString().split('T')[0];

const CHART_HEIGHT = 360;

// Shared sx for chart Paper cards
const chartPaperSx = {
  p: 3,
  height: CHART_HEIGHT,
  display: 'flex',
  flexDirection: 'column',
  transition: 'box-shadow 0.3s, transform 0.3s',
  '&:hover': { boxShadow: 8, transform: 'translateY(-2px)' },
};

// Turno colors matching the hourly chart legend
const TURNO_COLORS = {
  'Madrugada': '#64748b',
  'Manhã': '#f59e0b',
  'Tarde': '#3b82f6',
  'Noite': '#6366f1',
};

// Rank medal colors and styles
const RANK_STYLES = [
  { bg: 'linear-gradient(135deg, #ffd700 0%, #ffec80 100%)', color: '#92400e', border: '#fbbf24', shadow: '0 2px 12px rgba(251,191,36,0.4)' },
  { bg: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)', color: '#374151', border: '#9ca3af', shadow: '0 2px 8px rgba(156,163,175,0.35)' },
  { bg: 'linear-gradient(135deg, #cd7f32 0%, #e8a862 100%)', color: '#451a03', border: '#d97706', shadow: '0 2px 8px rgba(217,119,6,0.3)' },
  { bg: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', color: '#fff', border: '#6366f1', shadow: '0 1px 4px rgba(99,102,241,0.2)' },
  { bg: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', color: '#fff', border: '#8b5cf6', shadow: '0 1px 4px rgba(139,92,246,0.2)' },
];

// Game-style ranking component for Top 5 Parceiros
const RankingChart = ({ data, animKey, selectedParceiro }) => {
  // Separate highlighted partner (appended at end if outside top 5) from the main list
  const allItems = data || [];
  const destacadoItem = allItems.find(d => d.destacado && d.posicao);
  const top5 = allItems.filter(d => !d.posicao).slice(0, 5);
  const maxVal = top5.length > 0 ? Math.max(...top5.map(d => d.exibicoes), 1) : 1;

  if (top5.length === 0 && !destacadoItem) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary" variant="body2">Sem dados de parceiros.</Typography>
      </Box>
    );
  }

  const renderRow = (item, idx, isHighlighted, position) => {
    const style = RANK_STYLES[Math.min(idx, 4)] || RANK_STYLES[4];
    const barPercent = (item.exibicoes / maxVal) * 100;
    return (
      <Grow in key={`${animKey}-rank-${position || idx}`} timeout={400 + idx * 150}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          '&:hover': { transform: 'scale(1.02)', boxShadow: style.shadow },
          ...(isHighlighted && {
            border: '2px solid',
            borderColor: 'primary.main',
            bgcolor: 'action.selected',
          }),
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: `${barPercent}%`,
            background: style.bg,
            opacity: 0.12,
            borderRadius: 2,
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}>
          {/* Position badge */}
          <Box sx={{
            minWidth: 32, height: 32, borderRadius: '50%',
            background: style.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${style.border}`,
            boxShadow: style.shadow,
            position: 'relative',
            zIndex: 1,
          }}>
            {idx < 3 && !position ? (
              <EmojiEventsIcon sx={{ fontSize: 16, color: style.color }} />
            ) : (
              <Typography variant="caption" fontWeight={800} sx={{ color: style.color, fontSize: '0.75rem' }}>
                {position || idx + 1}
              </Typography>
            )}
          </Box>

          {/* Name */}
          <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <Typography
              variant="body2"
              fontWeight={isHighlighted ? 700 : (idx === 0 ? 700 : 500)}
              noWrap
              sx={{ fontSize: idx === 0 || isHighlighted ? '0.9rem' : '0.8rem' }}
            >
              {item.parceiro}
            </Typography>
          </Box>

          {/* Score */}
          <Box sx={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', gap: 0.5,
          }}>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{
                fontSize: idx === 0 || isHighlighted ? '1rem' : '0.85rem',
                background: style.bg,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: idx < 3 && !position ? 'transparent' : undefined,
                color: (idx >= 3 || position) ? style.border : undefined,
              }}
            >
              {item.exibicoes}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
              exib.
            </Typography>
          </Box>
        </Box>
      </Grow>
    );
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, mt: 1 }}>
      {top5.map((item, idx) => {
        const isHighlighted = !!item.destacado;
        return renderRow(item, idx, isHighlighted, null);
      })}
      {/* Show selected partner separately if not in top 5 */}
      {destacadoItem && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.5 }}>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Posição do parceiro selecionado
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
          </Box>
          {renderRow(destacadoItem, destacadoItem.posicao - 1, true, destacadoItem.posicao)}
        </>
      )}
    </Box>
  );
};

// Donut chart for Campanhas por Turno
const DonutChart = ({ data, animKey }) => {
  const [hovered, setHovered] = useState(null);

  const items = (data || []).map(item => ({
    ...item,
    color: TURNO_COLORS[item.turno] || '#94a3b8',
  }));

  const total = items.reduce((sum, item) => sum + item.campanhas, 0);

  if (total === 0) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary" variant="body2">Sem campanhas ativas.</Typography>
      </Box>
    );
  }

  // SVG donut parameters
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 55;
  const strokeWidth = 22;

  // Calculate arcs
  let cumulativeAngle = -90; // start from top
  const arcs = items.map((item) => {
    const angle = (item.campanhas / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...item, startAngle, angle };
  });

  const describeArc = (startAngle, angle) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      {/* Donut SVG */}
      <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((arc, idx) => (
            <path
              key={`${animKey}-donut-${idx}`}
              d={describeArc(arc.startAngle, arc.angle - 1)}
              fill="none"
              stroke={arc.color}
              strokeWidth={hovered === idx ? strokeWidth + 4 : strokeWidth}
              strokeLinecap="round"
              style={{
                transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                opacity: hovered !== null && hovered !== idx ? 0.4 : 1,
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        {/* Center text */}
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <Typography variant="h5" fontWeight={700}>
            {hovered !== null ? items[hovered].campanhas : total}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {hovered !== null ? items[hovered].turno : 'Total'}
          </Typography>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        {items.map((item, idx) => {
          const percent = total > 0 ? Math.round((item.campanhas / total) * 100) : 0;
          return (
            <Box
              key={idx}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                opacity: hovered !== null && hovered !== idx ? 0.5 : 1,
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                '&:hover': { transform: 'translateX(4px)' },
              }}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem', lineHeight: 1.2 }}>
                  {item.turno}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  {item.campanhas} camp. ({percent}%)
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// Animated horizontal bar with hover tooltip
const AnimatedBar = ({ label, value, maxValue, color, delay = 0 }) => {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const percent = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percent), 50 + delay);
    return () => clearTimeout(timer);
  }, [percent, delay]);

  return (
    <Tooltip title={`${label}: ${value}`} arrow placement="top">
      <Box sx={{ mb: 1.5, cursor: 'pointer', '&:hover .bar-track': { transform: 'scaleY(1.3)' } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
          <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: '65%', fontSize: '0.8rem' }}>{label}</Typography>
          <Typography variant="body2" fontWeight={700} sx={{ color, fontSize: '0.8rem' }}>{value}</Typography>
        </Box>
        <Box className="bar-track" sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: alpha(color, 0.1),
          overflow: 'hidden',
          transition: 'transform 0.2s ease',
          transformOrigin: 'center',
        }}>
          <Box sx={{
            height: '100%',
            width: `${animatedPercent}%`,
            borderRadius: 4,
            bgcolor: color,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </Box>
      </Box>
    </Tooltip>
  );
};

// Animated vertical bar for hourly chart
const VerticalBar = ({ value, maxValue, color, label, hour, delay = 0 }) => {
  const [animatedHeight, setAnimatedHeight] = useState(0);
  const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedHeight(heightPercent), 100 + delay);
    return () => clearTimeout(timer);
  }, [heightPercent, delay]);

  return (
    <Tooltip title={`${hour}: ${value} exibições`} arrow>
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
        cursor: 'pointer',
        '&:hover .vbar': { filter: 'brightness(1.25)', transform: 'scaleX(1.3)' },
      }}>
        <Typography variant="caption" sx={{ fontSize: '0.5rem', mb: 0.3, color: 'text.secondary', opacity: value > 0 ? 1 : 0 }}>
          {value}
        </Typography>
        <Box className="vbar" sx={{
          width: '70%',
          height: `${Math.max(animatedHeight, value > 0 ? 4 : 1)}%`,
          bgcolor: color,
          borderRadius: '3px 3px 0 0',
          minHeight: 3,
          transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s ease, transform 0.2s ease',
          transformOrigin: 'bottom',
        }} />
        <Typography variant="caption" sx={{ fontSize: '0.45rem', mt: 0.3, color: 'text.secondary' }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
};

// Animated area chart using SVG with hover tooltips
const AreaChartSimple = ({ data, color, height = 200 }) => {
  const gradientId = useId();
  const [show, setShow] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    setShow(false);
    const timer = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.exibicoes), 1);
  const width = 100;
  const h = height;
  const paddingX = 4;
  const paddingTop = 10;
  const paddingBottom = 4;
  const chartH = h - paddingTop - paddingBottom;

  // Handle single data point — show as a bar/dot instead
  if (data.length === 1) {
    const barHeight = (data[0].exibicoes / maxVal) * chartH;
    const cx = width / 2;
    const cy = h - paddingBottom - barHeight;
    return (
      <Box sx={{ width: '100%', height, position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <rect
            x={cx - 8}
            y={cy}
            width={16}
            height={barHeight}
            rx={3}
            fill={color}
            style={{ opacity: show ? 1 : 0, transition: 'opacity 0.8s ease' }}
          />
          <circle cx={cx} cy={cy} r="3" fill={color} style={{ opacity: show ? 1 : 0, transition: 'opacity 1s ease 0.3s' }} />
        </svg>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
            {data[0].data} — {data[0].exibicoes} exib.
          </Typography>
        </Box>
      </Box>
    );
  }

  const points = data.map((d, i) => ({
    x: paddingX + (i / (data.length - 1)) * (width - paddingX * 2),
    y: h - paddingBottom - ((d.exibicoes / maxVal) * chartH),
  }));

  // Simpler fallback: straight lines (more reliable)
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  // Calculate column width for hover zones
  const colWidth = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : width;

  return (
    <Box sx={{ width: '100%', height, position: 'relative' }}>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
          style={{
            opacity: show ? 1 : 0,
            transition: 'opacity 1s ease',
          }}
        />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: show ? 'none' : '1000',
            strokeDashoffset: show ? 0 : 1000,
            transition: 'stroke-dashoffset 1.5s ease, opacity 1s ease',
            opacity: show ? 1 : 0,
          }}
        />
        {/* Hover zones (invisible rects for each data point) */}
        {points.map((p, i) => (
          <rect
            key={`hover-${i}`}
            x={p.x - colWidth / 2}
            y={0}
            width={colWidth}
            height={h}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredIndex(i)}
          />
        ))}
        {/* Vertical guide line on hover */}
        {hoveredIndex !== null && (
          <line
            x1={points[hoveredIndex].x}
            y1={paddingTop}
            x2={points[hoveredIndex].x}
            y2={h - paddingBottom}
            stroke={color}
            strokeWidth="0.5"
            strokeDasharray="2,1"
            opacity={0.6}
          />
        )}
        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === i ? 2.5 : 1.2}
            fill={color}
            stroke={hoveredIndex === i ? '#fff' : 'none'}
            strokeWidth={hoveredIndex === i ? 0.8 : 0}
            style={{
              opacity: show ? 1 : 0,
              transition: `opacity 0.5s ease ${0.5 + i * 0.05}s, r 0.2s ease`,
            }}
          />
        ))}
      </svg>
      {/* Tooltip on hover */}
      {hoveredIndex !== null && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            px: 1.2,
            py: 0.4,
            boxShadow: 2,
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
            {data[hoveredIndex].data}: <strong>{data[hoveredIndex].exibicoes}</strong> exibições
          </Typography>
        </Box>
      )}
      {/* X-axis labels */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
        {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((d, i) => (
          <Typography key={i} variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>{d.data}</Typography>
        ))}
      </Box>
    </Box>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [parceiros, setParceiros] = useState([]);
  const [selectedParceiro, setSelectedParceiro] = useState('');
  const defaultDataInicio = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateInput(d);
  };
  const defaultDataFim = () => formatDateInput(new Date());

  const [dataInicio, setDataInicio] = useState(defaultDataInicio);
  const [dataFim, setDataFim] = useState(defaultDataFim);
  const [error, setError] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { data_inicio: dataInicio, data_fim: dataFim };
      if (selectedParceiro) params.parceiro_id = selectedParceiro;
      const res = await api.get('dashboard/analytics/', { params });
      setData(res.data);
      if (res.data.parceiros) setParceiros(res.data.parceiros);
      setAnimKey(prev => prev + 1);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Não foi possível carregar os dados do dashboard.');
    } finally {
      setLoading(false);
    }
  }, [selectedParceiro, dataInicio, dataFim]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  const kpiCards = [
    { label: 'Parceiros', value: kpis.total_parceiros, icon: <PeopleIcon />, color: '#3b82f6' },
    { label: 'Campanhas', value: kpis.total_campanhas, icon: <CampaignIcon />, color: '#8b5cf6' },
    { label: 'Ativas', value: kpis.campanhas_ativas, icon: <PlayArrowIcon />, color: '#10b981' },
    { label: 'Pendentes', value: kpis.campanhas_pendentes, icon: <PendingActionsIcon />, color: '#f59e0b' },
    { label: 'Pausadas', value: kpis.campanhas_pausadas, icon: <PauseCircleIcon />, color: '#ef4444' },
    { label: 'Exibições', value: kpis.total_exibicoes, icon: <VisibilityIcon />, color: '#06b6d4' },
  ];

  const selectedParceiroName = useMemo(() => {
    if (!selectedParceiro) return 'Todos os Parceiros';
    const p = parceiros.find(item => item.id === Number(selectedParceiro));
    return p ? p.nome_empresa : 'Parceiro';
  }, [selectedParceiro, parceiros]);

  const maxHora = useMemo(() => {
    if (!charts.exibicoes_por_hora) return 1;
    return Math.max(...charts.exibicoes_por_hora.map(h => h.exibicoes), 1);
  }, [charts.exibicoes_por_hora]);

  const getHourColor = (idx) => {
    if (idx >= 6 && idx < 12) return '#f59e0b';
    if (idx >= 12 && idx < 18) return '#3b82f6';
    if (idx >= 18) return '#6366f1';
    return '#64748b';
  };

  if (error && !loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>{error}</Typography>
          <Typography variant="body2" color="text.secondary">Verifique se o servidor está rodando e tente novamente.</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Acompanhamento de desempenho — {selectedParceiroName}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            type="date"
            size="small"
            label="Data Início"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value || defaultDataInicio())}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: dataFim }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            type="date"
            size="small"
            label="Data Fim"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value || defaultDataFim())}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: dataInicio, max: formatDateInput(new Date()) }}
            sx={{ minWidth: 160 }}
          />
          <TextField select size="small" value={selectedParceiro} onChange={(e) => setSelectedParceiro(e.target.value)} label="Parceiro" sx={{ minWidth: 220 }}>
            <MenuItem value="">Todos os Parceiros</MenuItem>
            {parceiros.map(p => (<MenuItem key={p.id} value={p.id}>{p.nome_empresa}</MenuItem>))}
          </TextField>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiCards.map((kpi, idx) => (
          <Grid item xs={6} sm={4} md={2} key={idx}>
            <Grow in={!loading} timeout={300 + idx * 100}>
              <Card sx={{
                height: 130,
                width: '100%',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': { transform: 'translateY(-6px)', boxShadow: 8 },
              }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 2, px: 1 }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: 2,
                    bgcolor: alpha(kpi.color, 0.1),
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1,
                    transition: 'transform 0.3s ease, background-color 0.3s ease',
                    '&:hover': { transform: 'scale(1.15) rotate(5deg)', bgcolor: alpha(kpi.color, 0.2) },
                  }}>
                    {React.cloneElement(kpi.icon, { sx: { color: kpi.color, fontSize: 22 } })}
                  </Box>
                  {loading ? <Skeleton width={50} height={32} /> : (
                    <Typography variant="h5" fontWeight={700}>{kpi.value ?? 0}</Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" textAlign="center" noWrap>{kpi.label}</Typography>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* Row 1: Top Parceiros | Ocupação de Inventário | Campanhas Ativas por Turno */}
      <Fade in={!loading} timeout={600}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Top Parceiros — Ranking */}
          <Grid item xs={12} md={4}>
            <Paper sx={chartPaperSx}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <EmojiEventsIcon sx={{ color: '#fbbf24', fontSize: 22 }} />
                <Typography variant="h6" fontWeight={600}>Ranking Parceiros</Typography>
              </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {selectedParceiro ? 'Posição individual no ranking' : 'Exibições por período'}
              </Typography>
              {loading ? <Skeleton variant="rectangular" sx={{ flex: 1 }} /> : (
                <RankingChart data={charts.top_parceiros} animKey={animKey} selectedParceiro={selectedParceiro} />
              )}
            </Paper>
          </Grid>

          {/* Ocupação de Inventário */}
          <Grid item xs={12} md={4}>
            <Paper sx={chartPaperSx}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Ocupação de Inventário</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>Segundos utilizados / 300s por turno</Typography>
              {loading ? <Skeleton variant="rectangular" sx={{ flex: 1 }} /> : (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {(charts.ocupacao_por_turno || []).map((item, idx) => {
                    const color = item.percentual > 80 ? '#ef4444' : item.percentual > 50 ? '#f59e0b' : '#10b981';
                    return (
                      <AnimatedBar
                        key={`${animKey}-ocu-${idx}`}
                        label={`${item.turno} (${item.percentual}%)`}
                        value={item.usado}
                        maxValue={300}
                        color={color}
                        delay={idx * 120}
                      />
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Campanhas Ativas por Turno — Donut */}
          <Grid item xs={12} md={4}>
            <Paper sx={chartPaperSx}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Campanhas por Turno</Typography>
              {loading ? <Skeleton variant="rectangular" sx={{ flex: 1 }} /> : (
                <DonutChart data={charts.campanhas_por_turno} animKey={animKey} />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Fade>

      {/* Row 2: Exibições por Dia | Exibições por Hora */}
      <Fade in={!loading} timeout={900}>
        <Grid container spacing={3}>
          {/* Exibições por Dia */}
          <Grid item xs={12} md={6}>
            <Paper sx={chartPaperSx}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Exibições por Dia</Typography>
              {loading ? <Skeleton variant="rectangular" sx={{ flex: 1 }} /> : charts.exibicoes_por_dia?.length > 0 ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <AreaChartSimple
                    key={animKey}
                    data={charts.exibicoes_por_dia.slice(-15)}
                    color={theme.palette.primary.main}
                    height={240}
                  />
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary" variant="body2">Sem dados de exibição.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Exibições por Hora */}
          <Grid item xs={12} md={6}>
            <Paper sx={chartPaperSx}>
              <Typography variant="h6" fontWeight={600} gutterBottom>Exibições por Hora</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Distribuição ao longo das 24h</Typography>
              {loading ? <Skeleton variant="rectangular" sx={{ flex: 1 }} /> : (charts.exibicoes_por_hora || []).some(h => h.exibicoes > 0) ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.3, flex: 1 }}>
                    {(charts.exibicoes_por_hora || []).map((item, idx) => (
                      <VerticalBar
                        key={`${animKey}-${idx}`}
                        value={item.exibicoes}
                        maxValue={maxHora}
                        color={getHourColor(idx)}
                        label={item.hora.replace(':00', 'h')}
                        hour={item.hora}
                        delay={idx * 30}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 1 }}>
                    {[
                      { color: '#64748b', label: 'Madrug.' },
                      { color: '#f59e0b', label: 'Manhã' },
                      { color: '#3b82f6', label: 'Tarde' },
                      { color: '#6366f1', label: 'Noite' },
                    ].map((l, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: l.color }} />
                        <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>{l.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary" variant="body2">Sem dados por hora.</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Fade>
    </Container>
  );
};

export default Dashboard;
