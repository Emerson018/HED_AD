import React, { useState } from 'react';
import useIdleTimeout from '../utils/useIdleTimeout';
import { idleLogout } from '../utils/secureLogout';
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
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
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
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';

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
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('user_role');
  const userName = localStorage.getItem('user_name') || (userRole === 'ADMIN_HED' ? 'Administrador' : 'Parceiro');
  const muiTheme = useMuiTheme();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = () => {
    setLogoutDialogOpen(false);
    // Logout seguro: limpa tudo e impede navegação "Voltar"
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/login');
  };

  // Auto-logout por inatividade (15 minutos) - desativado para o player de TV
  const isPlayerRoute = location.pathname.startsWith('/tv/player');
  useIdleTimeout(idleLogout, 15 * 60 * 1000, isPlayerRoute);

  const mainMenuItems = userRole === 'ADMIN_HED' 
    ? [
        { text: 'Painel de Gestão', icon: <AdminPanelSettingsIcon />, path: '/admin' },
        { text: 'Dashboard', icon: <BarChartIcon />, path: '/admin/dashboard' },
        { text: 'Campanha Institucional', icon: <LocalHospitalIcon />, path: '/admin/institucional' },
        { text: 'Usuários', icon: <PeopleIcon />, path: '/admin/usuarios' },
        { text: 'Simulador de TV', icon: <TvIcon />, path: '/admin/preview' },
        { text: 'Logs do Sistema', icon: <HistoryIcon />, path: '/admin/logs' },
      ]
    : [
        { text: 'Minhas Campanhas', icon: <CampaignIcon />, path: '/parceiro/campanhas' },
        { text: 'Nova Campanha', icon: <AddCircleIcon />, path: '/parceiro/upload' },
      ];

  const supportMenuItems = userRole === 'ADMIN_HED'
    ? [
        { text: 'Opções', icon: <SettingsIcon />, path: '/admin/opcoes' },
      ]
    : [
        { text: 'Dúvidas (FAQ)', icon: <HelpIcon />, path: '/faq' },
        { text: 'Termos de Uso', icon: <GavelIcon />, path: '/termos' },
      ];

  // Não mostrar sidebar na tela de login, registro, recuperação de senha ou player de TV
  const isBypassLayout = 
    location.pathname === '/login' || 
    location.pathname === '/' || 
    location.pathname === '/esqueci-senha' ||
    location.pathname.startsWith('/redefinir-senha') ||
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
            // Scrollbar profissional para sidebar
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '3px',
              '&:hover': {
                background: 'rgba(255,255,255,0.25)',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.15) transparent',
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
          justifyContent: 'center',
          minHeight: 60,
          gap: open ? 1.5 : 0.5,
          flexDirection: open ? 'row' : 'column',
        }}>
          {/* Ícone do logo: sempre visível */}
          <Box sx={{
            width: 38,
            height: 38,
            minWidth: 38,
            borderRadius: 2,
            bgcolor: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: !open ? 'pointer' : 'default',
            transition: 'transform 0.2s',
            '&:hover': !open ? { transform: 'scale(1.05)' } : {},
          }}
            onClick={!open ? handleDrawerToggle : undefined}
          >
            <CampaignIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>

          {/* Texto do logo + botão fechar (fade controlado, só quando aberto) */}
          {open && (
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ lineHeight: 1.2, letterSpacing: '0.02em' }}>
                  HED Campanhas
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: mutedText, fontSize: '0.65rem', lineHeight: 1 }}>
                  Gestão de Campanhas
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
          )}
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mx: 1 }} />

        {/* User Profile */}
        <Tooltip title={!open ? `${userName} — ${userRole === 'ADMIN_HED' ? 'Administrador HED' : 'Parceiro Comercial'}` : ''} placement="right" arrow>
          <Box sx={{ px: open ? 2 : 1, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: open ? 'initial' : 'center' }}>
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
            {open && (
              <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {userName}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: mutedText, fontSize: '0.7rem' }}>
                  {userRole === 'ADMIN_HED' ? 'Administrador HED' : 'Parceiro Comercial'}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mx: 1, mb: 1 }} />

        {/* Seção: Menu Principal */}
        {open && (
          <Typography 
            variant="overline" 
            sx={{ 
              px: 3, pt: 1.5, pb: 0.5, color: mutedText, fontSize: '0.65rem', letterSpacing: '0.08em',
              display: 'block',
              whiteSpace: 'nowrap',
            }}
          >
            Menu Principal
          </Typography>
        )}

        <List sx={{ px: 0, py: 0 }}>
          {mainMenuItems.map(renderNavItem)}
        </List>

        {/* Seção: Suporte */}
        <Box sx={{ mt: 1 }}>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.06)', mx: 1, mb: 0.5 }} />
          {open && (
            <Typography 
              variant="overline" 
              sx={{ 
                px: 3, pt: 1.5, pb: 0.5, color: mutedText, fontSize: '0.65rem', letterSpacing: '0.08em',
                display: 'block',
                whiteSpace: 'nowrap',
              }}
            >
              Suporte
            </Typography>
          )}
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
              onClick={handleLogoutClick}
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
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>

      {/* Diálogo de confirmação de logout */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        PaperProps={{
          sx: {
            borderRadius: 3,
            px: 1,
            py: 0.5,
            minWidth: 340,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <PowerSettingsNewIcon sx={{ color: '#ef4444' }} />
          Sair do sistema
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleLogoutCancel} 
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleLogoutConfirm} 
            variant="contained" 
            color="error"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Sair
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Layout;
