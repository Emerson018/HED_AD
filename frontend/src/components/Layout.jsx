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
  Tooltip
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
import StorageIcon from '@mui/icons-material/Storage';

const drawerWidth = 260;

const Layout = ({ children, toggleTheme, mode }) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('user_role');
  const muiTheme = useMuiTheme();
  const [activeDb, setActiveDb] = useState(localStorage.getItem('active_db') || 'supabase');

  const handleDbToggle = () => {
    const newDb = activeDb === 'supabase' ? 'local' : 'supabase';
    localStorage.setItem('active_db', newDb);
    setActiveDb(newDb);
    window.location.reload();
  };

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = userRole === 'ADMIN_HED' 
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

  // Não mostrar sidebar na tela de login, registro ou player de TV
  const isBypassLayout = 
    location.pathname === '/login' || 
    location.pathname === '/' || 
    location.pathname === '/register' || 
    location.pathname.startsWith('/tv/player');

  if (isBypassLayout) return <>{children}</>;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : 70,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : 70,
            boxSizing: 'border-box',
            transition: muiTheme.transitions.create('width', {
              easing: muiTheme.transitions.easing.sharp,
              duration: muiTheme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            bgcolor: mode === 'light' ? 'primary.main' : '#1e1e1e',
            color: 'white',
            borderRight: 'none',
          },
        }}
        open={open}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center' }}>
          {open && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CampaignIcon fontSize="large" sx={{ color: 'white' }} />
              <Typography variant="h6" fontWeight="bold" noWrap>
                HED AD
              </Typography>
            </Box>
          )}
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>

        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

        <List sx={{ mt: 2, flexGrow: 1 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={!open ? item.text : ""} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {open && <ListItemText primary={item.text} sx={{ opacity: 1 }} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>

        <Box sx={{ p: 2 }}>
          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 2 }} />
          
          {/* Database Toggle */}
          <Tooltip title={`Banco Atual: ${activeDb === 'supabase' ? 'Supabase (Nuvem)' : 'SQLite (Local)'}`} placement="right">
            <ListItemButton 
              onClick={handleDbToggle}
              sx={{ 
                borderRadius: 2, 
                mb: 1.5,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                bgcolor: activeDb === 'supabase' ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 179, 0, 0.12)',
                border: '1px solid',
                borderColor: activeDb === 'supabase' ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 179, 0, 0.25)',
                '&:hover': {
                  bgcolor: activeDb === 'supabase' ? 'rgba(0, 230, 118, 0.22)' : 'rgba(255, 179, 0, 0.22)',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', color: activeDb === 'supabase' ? '#00e676' : '#ffb300' }}>
                <StorageIcon />
              </ListItemIcon>
              {open && (
                <ListItemText 
                  primary={activeDb === 'supabase' ? 'BD: Supabase' : 'BD: Local (SQLite)'} 
                  primaryTypographyProps={{ 
                    fontWeight: 'bold', 
                    fontSize: '0.85rem',
                    color: activeDb === 'supabase' ? '#00e676' : '#ffb300'
                  }} 
                />
              )}
            </ListItemButton>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip title={mode === 'light' ? 'Modo Escuro' : 'Modo Claro'} placement="right">
            <ListItemButton 
              onClick={toggleTheme}
              sx={{ 
                borderRadius: 2, 
                justifyContent: open ? 'initial' : 'center',
                px: 2.5 
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', color: 'white' }}>
                {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
              </ListItemIcon>
              {open && <ListItemText primary={mode === 'light' ? 'Modo Escuro' : 'Modo Claro'} />}
            </ListItemButton>
          </Tooltip>

          {/* Logout */}
          <ListItemButton 
            onClick={handleLogout}
            sx={{ 
              borderRadius: 2, 
              mt: 1, 
              color: '#ff5252',
              justifyContent: open ? 'initial' : 'center',
              px: 2.5
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', color: '#ff5252' }}>
              <LogoutIcon />
            </ListItemIcon>
            {open && <ListItemText primary="Sair" />}
          </ListItemButton>
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
