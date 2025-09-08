import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { Menu as MenuIcon, Map as MapIcon, Dashboard as DashboardIcon, Layers as LayersIcon, Settings as SettingsIcon } from '@mui/icons-material';
import MapView from './components/MapView';
import AdminDashboard from './components/AdminDashboard';
import LayerManager from './components/LayerManager';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
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
    { text: 'Map View', icon: <MapIcon />, view: 'map' },
    { text: 'Admin Dashboard', icon: <DashboardIcon />, view: 'admin' },
    { text: 'Layer Manager', icon: <LayersIcon />, view: 'layers' },
    { text: 'Settings', icon: <SettingsIcon />, view: 'settings' },
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'map':
        return <MapView />;
      case 'admin':
        return <AdminDashboard />;
      case 'layers':
        return <LayerManager />;
      case 'settings':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4">Settings</Typography>
            <Typography>Settings panel will be implemented here.</Typography>
          </Box>
        );
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
              GeoGIS - Professional Mapping Solution
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
