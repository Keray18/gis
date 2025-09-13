import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ExpandMore as ExpandMoreIcon,
  Layers as LayersIcon,
  Satellite as SatelliteIcon,
  Terrain as TerrainIcon,
  Public as PublicIcon
} from '@mui/icons-material';

const LayerManager = () => {
  const [layers, setLayers] = useState([
    {
      id: 1,
      name: 'OpenStreetMap',
      type: 'tile',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      visible: true,
      opacity: 1,
      category: 'base',
      description: 'Standard OpenStreetMap tiles'
    },
    {
      id: 2,
      name: 'Satellite Imagery',
      type: 'tile',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      visible: false,
      opacity: 0.8,
      category: 'base',
      description: 'High-resolution satellite imagery'
    },
    {
      id: 3,
      name: 'Terrain Map',
      type: 'tile',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      visible: false,
      opacity: 0.9,
      category: 'base',
      description: 'Topographic terrain map'
    },
    {
      id: 4,
      name: 'Traffic Data',
      type: 'overlay',
      url: 'https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json',
      visible: true,
      opacity: 0.7,
      category: 'traffic',
      description: 'Real-time traffic information'
    },
    {
      id: 5,
      name: 'Weather Stations',
      type: 'marker',
      url: 'https://api.openweathermap.org/data/2.5/weather',
      visible: true,
      opacity: 1,
      category: 'weather',
      description: 'Weather station locations and data'
    }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingLayer, setEditingLayer] = useState(null);
  const [newLayer, setNewLayer] = useState({
    name: '',
    type: 'tile',
    url: '',
    category: 'base',
    description: '',
    opacity: 1
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const layerCategories = {
    base: { name: 'Base Layers', icon: <PublicIcon />, color: 'primary' },
    traffic: { name: 'Traffic', icon: <TerrainIcon />, color: 'warning' },
    weather: { name: 'Weather', icon: <SatelliteIcon />, color: 'info' },
    custom: { name: 'Custom', icon: <LayersIcon />, color: 'secondary' }
  };

  const handleToggleVisibility = (layerId) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const handleOpacityChange = (layerId, newOpacity) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, opacity: newOpacity } : layer
    ));
  };

  const handleAddLayer = () => {
    setEditingLayer(null);
    setNewLayer({
      name: '',
      type: 'tile',
      url: '',
      category: 'base',
      description: '',
      opacity: 1
    });
    setOpenDialog(true);
  };

  const handleEditLayer = (layer) => {
    setEditingLayer(layer);
    setNewLayer(layer);
    setOpenDialog(true);
  };

  const handleDeleteLayer = (layerId) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    setSnackbar({ open: true, message: 'Layer deleted successfully', severity: 'success' });
  };

  const handleSaveLayer = () => {
    if (editingLayer) {
      // Edit existing layer
      setLayers(prev => prev.map(layer => 
        layer.id === editingLayer.id ? { ...newLayer, id: editingLayer.id, visible: editingLayer.visible } : layer
      ));
      setSnackbar({ open: true, message: 'Layer updated successfully', severity: 'success' });
    } else {
      // Add new layer
      const layer = {
        ...newLayer,
        id: Date.now(),
        visible: true
      };
      setLayers(prev => [...prev, layer]);
      setSnackbar({ open: true, message: 'Layer added successfully', severity: 'success' });
    }
    setOpenDialog(false);
  };

  const getLayerIcon = (type) => {
    switch (type) {
      case 'tile': return <PublicIcon />;
      case 'overlay': return <LayersIcon />;
      case 'marker': return <SatelliteIcon />;
      default: return <LayersIcon />;
    }
  };

  const groupedLayers = layers.reduce((acc, layer) => {
    if (!acc[layer.category]) {
      acc[layer.category] = [];
    }
    acc[layer.category].push(layer);
    return acc;
  }, {});

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Layer Manager
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddLayer}
        >
          Add Layer
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage map layers, control visibility, and organize your mapping data. 
        Add custom layers, adjust opacity, and categorize your data sources.
      </Typography>

      {/* Layer Categories */}
      {Object.entries(groupedLayers).map(([category, categoryLayers]) => (
        <Accordion key={category} defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {layerCategories[category]?.icon}
              <Typography variant="h6">
                {layerCategories[category]?.name || category}
              </Typography>
              <Chip 
                label={categoryLayers.length} 
                size="small" 
                color={layerCategories[category]?.color}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {categoryLayers.map((layer) => (
                <Paper key={layer.id} sx={{ mb: 1, p: 1 }}>
                  <ListItem>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      {getLayerIcon(layer.type)}
                    </Box>
                    <ListItemText
                      primary={layer.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            {layer.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Type: {layer.type} | Opacity: {Math.round(layer.opacity * 100)}%
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={layer.visible}
                          onChange={() => handleToggleVisibility(layer.id)}
                          color="primary"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleEditLayer(layer)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteLayer(layer.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {/* Opacity Slider */}
                  <Box sx={{ px: 2, pb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Opacity
                    </Typography>
                    <Slider
                      value={layer.opacity}
                      onChange={(e, newValue) => handleOpacityChange(layer.id, newValue)}
                      min={0}
                      max={1}
                      step={0.1}
                      size="small"
                      disabled={!layer.visible}
                    />
                  </Box>
                </Paper>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Layer Statistics */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Layer Statistics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip
            label={`Total Layers: ${layers.length}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`Visible: ${layers.filter(l => l.visible).length}`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`Hidden: ${layers.filter(l => !l.visible).length}`}
            color="default"
            variant="outlined"
          />
          <Chip
            label={`Base Layers: ${layers.filter(l => l.category === 'base').length}`}
            color="info"
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Add/Edit Layer Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLayer ? 'Edit Layer' : 'Add New Layer'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Layer Name"
              value={newLayer.name}
              onChange={(e) => setNewLayer({ ...newLayer, name: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={newLayer.description}
              onChange={(e) => setNewLayer({ ...newLayer, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="URL/Endpoint"
              value={newLayer.url}
              onChange={(e) => setNewLayer({ ...newLayer, url: e.target.value })}
              margin="normal"
              helperText="For tile layers, use {s}, {z}, {x}, {y} placeholders"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Layer Type</InputLabel>
              <Select
                value={newLayer.type}
                onChange={(e) => setNewLayer({ ...newLayer, type: e.target.value })}
                label="Layer Type"
              >
                <MenuItem value="tile">Tile Layer</MenuItem>
                <MenuItem value="overlay">Overlay</MenuItem>
                <MenuItem value="marker">Marker Layer</MenuItem>
                <MenuItem value="vector">Vector Layer</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={newLayer.category}
                onChange={(e) => setNewLayer({ ...newLayer, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="base">Base Layer</MenuItem>
                <MenuItem value="traffic">Traffic</MenuItem>
                <MenuItem value="weather">Weather</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Opacity: {Math.round(newLayer.opacity * 100)}%</Typography>
              <Slider
                value={newLayer.opacity}
                onChange={(e, newValue) => setNewLayer({ ...newLayer, opacity: newValue })}
                min={0}
                max={1}
                step={0.1}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveLayer} variant="contained">
            {editingLayer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LayerManager;

