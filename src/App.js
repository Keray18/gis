import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Layers as LayersIcon, 
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  DataObject as DataObjectIcon,
  ThreeDRotation as ThreeDIcon
} from '@mui/icons-material';
import MapView from './components/MapView';
import AdminDashboard from './components/AdminDashboard';
import LayerManager from './components/LayerManager';
import DataVisualization from './components/DataVisualization';
import DataManager from './components/DataManager';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00bcd4',
    },
    secondary: {
      main: '#ff4081',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState('map');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const menuItems = [
    { text: '3D Map Viewer', icon: <ThreeDIcon />, view: 'map' },
    { text: 'Map Layers', icon: <LayersIcon />, view: 'layers' },
    { text: 'Data Visualization', icon: <AnalyticsIcon />, view: 'visualization' },
    { text: 'Data Manager', icon: <DataObjectIcon />, view: 'data' },
    { text: 'Admin Dashboard', icon: <SettingsIcon />, view: 'admin' },
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'map':
        return <MapView />;
      case 'layers':
        return <LayerManager />;
      case 'visualization':
        return <DataVisualization />;
      case 'data':
        return <DataManager />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <MapView />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              GeoAnalytics Pro
            </Typography>
            <Typography variant="caption" sx={{ mr: 2, opacity: 0.7 }}>
              Advanced GIS Platform
            </Typography>
            <Button color="inherit">Login</Button>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {menuItems.map((item) => (
                <ListItem
                  button
                  key={item.text}
                  onClick={() => {
                    setCurrentView(item.view);
                    setDrawerOpen(false);
                  }}
                  selected={currentView === item.view}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            width: { sm: `calc(100% - 240px)` },
            ml: { sm: 0 },
          }}
        >
          <Toolbar />
          {renderCurrentView()}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
