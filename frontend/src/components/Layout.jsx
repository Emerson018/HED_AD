import React, { useState } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton,
  IconButton, 
  Typography, 
  Divider, 
  useTheme as useMuiTheme,
  Avatar,
  Tooltip,
  alpha
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import TvIcon from '@mui/icons-material/Tv';
import HistoryIcon from '@mui/icons-material/History';
import HelpIcon from '@mui/icons-material/Help';
import GavelIcon from '@mui/icons-material/Gavel';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

const drawerWidth = 270;
const collapsedWidth = 72;

// Estilos compartilhados para texto com fade (evita reflow ao expandir/colapsar)
const textFadeSx = (isOpen) => ({
  opacity: isOpen ? 1 : 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  transition: 'opacity 0.15s ease',
  transitionDelay: isOpen ? '0.12s' : '0s', // aparece depois que o drawer já está quase aberto
});

const Layout = ({ children, toggleTheme, mode }) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('user_role');
  const userName = localStorage.getItem('user_name') || (userRole === 'ADMIN_HED' ? 'Administrador' : 'Parceiro');
  const muiTheme = useMuiTheme();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    localStorage.clear();
    localStorage.setItem('logout_success', 'true');
    navigate('/login');
  };

  const mainMenuItems = userRole === 'ADMIN_HED' 
    ? [
        { text: 'Dashboard Admin', icon: <AdminPanelSettingsIcon />, path: '/admin' },
        { text: 'Simulador de TV', icon: <TvIcon />, path: '/admin/preview' },
        { text: 'Logs do Sistema', icon: <HistoryIcon />, path: '/admin/logs' },
      ]
    : [
        { text: 'Início', icon: <DashboardIcon />, path: '/parceiro' },
        { text: 'Minhas Campanhas', icon: <CampaignIcon />, path: '/parceiro/campanhas' },
        { text: 'Nova Campanha', icon: <AddCircleIcon />, path: '/parceiro/upload' },
      ];

  const supportMenuItems = [
    { text: 'Dúvidas (FAQ)', icon: <HelpIcon />, path: '/faq' },
    { text: 'Termos de Uso', icon: <GavelIcon />, path: '/termos' },
  ];

  // Não mostrar sidebar na tela de login, registro ou player de TV
  const isBypassLayout = 
    location.pathname === '/login' || 
    location.pathname === '/' || 
    location.pathname === '/register' || 
    location.pathname.startsWith('/tv/player');

  if (isBypassLayout) return <>{children}</>;

  // Cores do sidebar
  const sidebarBg = mode === 'light' ? '#0d2137' : '#111827';
  const sidebarActiveBg = 'rgba(255,255,255,0.08)';
  const sidebarHoverBg = 'rgba(255,255,255,0.05)';
  const accentColor = '#3b82f6';
  const mutedText = 'rgba(255,255,255,0.45)';

  const renderNavItem = (item) => {
    const isActive = location.pathname === item.path;
    return (
      <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.3 }}>
        <Tooltip title={!open ? item.text : ""} placement="right" arrow>
          <ListItemButton
            onClick={() => navigate(item.path)}
            sx={{
              minHeight: 46,
              justifyContent: 'initial',
              px: 2,
              mx: 1,
              borderRadius: 2,
              position: 'relative',
              bgcolor: isActive ? sidebarActiveBg : 'transparent',
              '&:hover': { bgcolor: isActive ? sidebarActiveBg : sidebarHoverBg },
              // Indicador lateral ativo
              '&::before': isActive ? {
                content: '""',
                position: 'absolute',
                left: -8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 3,
                height: 24,
                borderRadius: '0 4px 4px 0',
                bgcolor: accentColor,
              } : {},
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 2,
                justifyContent: 'center',
                color: isActive ? accentColor : 'rgba(255,255,255,0.65)',
                transition: 'color 0.2s',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={textFadeSx(open)}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.75)',
                letterSpacing: '0.01em',
                noWrap: true,
              }}
            />
          </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: 'border-box',
            transition: muiTheme.transitions.create('width', {
              easing: muiTheme.transitions.easing.sharp,
              duration: muiTheme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            bgcolor: sidebarBg,
            color: 'white',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        open={open}
      >
        {/* Header: Logo + Toggle */}
        <Box sx={{ 
          px: open ? 2 : 0, 
          py: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: open ? 'initial' : 'center',
          minHeight: 60,
          gap: 1.5,
        }}>
          {/* Ícone do logo: sempre visível, serve de botão toggle quando colapsado */}
          <Tooltip title={!open ? 'Expandir menu' : ''} placement="right" arrow>
            <Box sx={{
              width: 38,
              height: 38,
              minWidth: 38,
              borderRadius: 2,
              bgcolor: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.05)' },
            }}
              onClick={!open ? handleDrawerToggle : undefined}
            >
              <CampaignIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
          </Tooltip>

          {/* Texto do logo + botão fechar (fade controlado) */}
          <Box sx={{ ...textFadeSx(open), display: 'flex', alignItems: 'center', flexGrow: 1, justifyContent: 'space-between', pointerEvents: open ? 'auto' : 'none' }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ lineHeight: 1.2, letterSpacing: '0.02em' }}>
                HED AD
              </Typography>
              <Typography variant="caption" noWrap sx={{ color: mutedText, fontSize: '0.65rem', lineHeight: 1 }}>
                Digital Signage
              </Typography>
            </Box>
            <IconButton 
              onClick={handleDrawerToggle} 
              sx={{ 
                color: 'rgba(255,255,255,0.6)', 
                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                width: 34,
                height: 34,
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mx: 1 }} />

        {/* User Profile */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: open ? 'initial' : 'center' }}>
          <Tooltip title={!open ? userName : ''} placement="right" arrow>
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36, 
                minWidth: 36,
                bgcolor: alpha(accentColor, 0.15),
                color: accentColor,
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
          <Box sx={{ ...textFadeSx(open), overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {userName}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: mutedText, fontSize: '0.7rem' }}>
              {userRole === 'ADMIN_HED' ? 'Administrador HED' : 'Parceiro Comercial'}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mx: 1, mb: 1 }} />

        {/* Seção: Menu Principal */}
        <Typography 
          variant="overline" 
          sx={{ 
            px: 3, pt: 1.5, pb: 0.5, color: mutedText, fontSize: '0.65rem', letterSpacing: '0.08em',
            ...textFadeSx(open),
            display: 'block',
            height: open ? 'auto' : 0,
          }}
        >
          Menu Principal
        </Typography>

        <List sx={{ px: 0, py: 0 }}>
          {mainMenuItems.map(renderNavItem)}
        </List>

        {/* Seção: Suporte */}
        <Box sx={{ mt: 1 }}>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mx: 1, mb: 0.5 }} />
          <Typography 
            variant="overline" 
            sx={{ 
              px: 3, pt: 1.5, pb: 0.5, color: mutedText, fontSize: '0.65rem', letterSpacing: '0.08em',
              ...textFadeSx(open),
              display: 'block',
              height: open ? 'auto' : 0,
            }}
          >
            Suporte
          </Typography>
          <List sx={{ px: 0, py: 0 }}>
            {supportMenuItems.map(renderNavItem)}
          </List>
        </Box>

        {/* Spacer para empurrar logout para o fundo */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Seção: Preferências & Logout (fundo fixo) */}
        <Box sx={{ px: 1, pb: 2 }}>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mb: 1.5, mx: 0.5 }} />

          {/* Theme Toggle */}
          <Tooltip title={!open ? (mode === 'light' ? 'Modo Escuro' : 'Modo Claro') : ''} placement="right" arrow>
            <ListItemButton 
              onClick={toggleTheme}
              sx={{ 
                borderRadius: 2, 
                justifyContent: 'initial',
                px: 2,
                mx: 0.5,
                minHeight: 42,
                '&:hover': { bgcolor: sidebarHoverBg },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 2, color: 'rgba(255,255,255,0.55)' }}>
                {mode === 'light' ? <Brightness4Icon fontSize="small" /> : <Brightness7Icon fontSize="small" />}
              </ListItemIcon>
              <ListItemText 
                primary={mode === 'light' ? 'Modo Escuro' : 'Modo Claro'} 
                sx={textFadeSx(open)}
                primaryTypographyProps={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', noWrap: true }}
              />
            </ListItemButton>
          </Tooltip>

          {/* Espaçamento generoso antes do botão Sair */}
          <Box sx={{ my: 2 }}>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mx: 0.5 }} />
          </Box>

          {/* Logout */}
          <Tooltip title={!open ? "Sair" : ""} placement="right" arrow>
            <ListItemButton 
              onClick={handleLogout}
              sx={{ 
                borderRadius: 2, 
                justifyContent: 'initial',
                px: 2,
                mx: 0.5,
                minHeight: 42,
                color: '#ef4444',
                bgcolor: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.12)',
                '&:hover': { 
                  bgcolor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: 2, color: '#ef4444' }}>
                <PowerSettingsNewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Sair" 
                sx={textFadeSx(open)}
                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500, noWrap: true }}
              />
            </ListItemButton>
          </Tooltip>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, transition: 'margin 0.3s' }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
