import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle, Polygon, Polyline } from 'react-leaflet';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  IconButton, 
  Tooltip, 
  Chip, 
  TextField, 
  InputAdornment,
  Slider,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge
} from '@mui/material';
import { 
  MyLocation as MyLocationIcon, 
  ZoomIn as ZoomInIcon, 
  ZoomOut as ZoomOutIcon,
  Search as SearchIcon,
  Straighten as MeasureIcon,
  Add as AddIcon,
  Layers as LayersIcon,
  ExpandMore as ExpandMoreIcon,
  Satellite as SatelliteIcon,
  Terrain as TerrainIcon,
  Map as MapIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Analytics as AnalyticsIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const MapView = () => {
  const [position, setPosition] = useState([37.7749, -122.4194]); // Default to San Francisco
  const [zoom, setZoom] = useState(12);
  const [markers, setMarkers] = useState([]);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [selectedTool, setSelectedTool] = useState('select');
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawnShapes, setDrawnShapes] = useState([]);
  const [layerOpacity, setLayerOpacity] = useState(100);
  
  const [mapLayers, setMapLayers] = useState([
    { 
      name: 'Satellite', 
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 
      active: true,
      type: 'base',
      attribution: '&copy; Esri'
    },
    { 
      name: 'OpenStreetMap', 
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
      active: false,
      type: 'base',
      attribution: '&copy; OpenStreetMap contributors'
    },
    { 
      name: 'Hybrid', 
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', 
      active: false,
      type: 'base',
      attribution: '&copy; Esri'
    },
    { 
      name: 'Terrain', 
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', 
      active: false,
      type: 'base',
      attribution: '&copy; OpenTopoMap'
    },
    { 
      name: 'Dark', 
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', 
      active: false,
      type: 'base',
      attribution: '&copy; CARTO'
    }
  ]);

  const [dataLayers, setDataLayers] = useState([
    { 
      name: 'Population Density', 
      visible: true, 
      opacity: 0.7, 
      type: 'raster',
      color: '#ff6b6b',
      description: 'Population density visualization'
    },
    { 
      name: 'Transportation', 
      visible: true, 
      opacity: 0.8, 
      type: 'vector',
      color: '#4ecdc4',
      description: 'Transportation networks'
    },
    { 
      name: 'Land Use', 
      visible: false, 
      opacity: 0.6, 
      type: 'raster',
      color: '#45b7d1',
      description: 'Land use classification'
    },
    { 
      name: 'Elevation', 
      visible: false, 
      opacity: 0.5, 
      type: 'raster',
      color: '#96ceb4',
      description: 'Digital elevation model'
    }
  ]);

  const [rasterData, setRasterData] = useState([
    { name: 'Landsat 8', bands: 4, resolution: '30m', date: '2024-01-15' },
    { name: 'Sentinel-2', bands: 13, resolution: '10m', date: '2024-01-10' }
  ]);

  const mapRef = useRef();

  // Component to handle map events
  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        if (measurementMode) {
          const newMarker = {
            id: Date.now(),
            position: [e.latlng.lat, e.latlng.lng],
            timestamp: new Date().toISOString()
          };
          setMarkers(prev => [...prev, newMarker]);
        }
      },
      zoomend: (e) => {
        setZoom(e.target.getZoom());
      }
    });
    return null;
  };

  // Component to handle map reference
  const MapRef = () => {
    const map = useMap();
    mapRef.current = map;
    return null;
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const toggleMeasurementMode = () => {
    setMeasurementMode(!measurementMode);
    if (!measurementMode) {
      setMarkers([]);
    }
  };

  const clearMarkers = () => {
    setMarkers([]);
  };

  const switchLayer = (layerName) => {
    setMapLayers(prev => prev.map(layer => ({
      ...layer,
      active: layer.name === layerName
    })));
  };

  const getActiveLayer = () => {
    return mapLayers.find(layer => layer.active);
  };

  const calculateDistance = () => {
    if (markers.length < 2) return null;
    
    let totalDistance = 0;
    for (let i = 0; i < markers.length - 1; i++) {
      const distance = mapRef.current.distance(
        markers[i].position,
        markers[i + 1].position
      );
      totalDistance += distance;
    }
    return (totalDistance / 1000).toFixed(2); // Convert to km
  };

  return (
    <Box sx={{ height: '100%', position: 'relative', display: 'flex' }}>
      {/* Main Map Container */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={position}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <MapRef />
          <MapEvents />
          
          <TileLayer
            attribution={getActiveLayer()?.attribution}
            url={getActiveLayer()?.url}
            opacity={layerOpacity / 100}
          />

          {/* Data Layers */}
          {dataLayers.filter(layer => layer.visible).map((layer, index) => (
            <TileLayer
              key={layer.name}
              url={`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`}
              opacity={layer.opacity}
              zIndex={1000 + index}
            />
          ))}

          {/* Markers */}
          {markers.map((marker) => (
            <Marker key={marker.id} position={marker.position}>
              <Popup>
                <Typography variant="body2">
                  <strong>Coordinates:</strong><br />
                  Lat: {marker.position[0].toFixed(6)}<br />
                  Lng: {marker.position[1].toFixed(6)}<br />
                  <strong>Time:</strong> {new Date(marker.timestamp).toLocaleString()}
                </Typography>
              </Popup>
            </Marker>
          ))}

          {/* Drawn Shapes */}
          {drawnShapes.map((shape, index) => (
            <Polygon
              key={index}
              positions={shape.positions}
              pathOptions={{ color: shape.color, fillOpacity: 0.3 }}
            />
          ))}
        </MapContainer>

        {/* Top Search Bar */}
        <Paper
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 1000,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <TextField
            fullWidth
            placeholder="Search locations or load KML data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'white' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" size="small" sx={{ bgcolor: '#00bcd4' }}>
            Load
          </Button>
        </Paper>

        {/* 3D Map Generator Section */}
        <Paper
          sx={{
            position: 'absolute',
            top: 80,
            left: 16,
            zIndex: 1000,
            p: 2,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            minWidth: 200
          }}
        >
          <Typography variant="h6" gutterBottom>
            3D Map Generator
          </Typography>
          <Button 
            variant="outlined" 
            size="small" 
            sx={{ mb: 1, borderColor: '#00bcd4', color: '#00bcd4' }}
          >
            Token Free
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Photorealistic Map - High-resolution satellite imagery with photorealistic detail.
          </Typography>
        </Paper>

        {/* Map Controls */}
        <Paper
          sx={{
            position: 'absolute',
            top: 80,
            right: 16,
            zIndex: 1000,
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Tooltip title="Home">
            <IconButton onClick={() => setPosition([37.7749, -122.4194])} sx={{ color: 'white' }}>
              <HomeIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="My Location">
            <IconButton onClick={handleLocationClick} sx={{ color: 'white' }}>
              <MyLocationIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} sx={{ color: 'white' }}>
              <ZoomInIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} sx={{ color: 'white' }}>
              <ZoomOutIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()} sx={{ color: 'white' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Paper>

        {/* Layer Switcher */}
        <Paper
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 1000,
            p: 1,
            display: 'flex',
            gap: 1,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {mapLayers.map((layer) => (
            <Chip
              key={layer.name}
              label={layer.name}
              onClick={() => switchLayer(layer.name)}
              color={layer.active ? "primary" : "default"}
              size="small"
              sx={{ 
                color: layer.active ? 'white' : 'rgba(255,255,255,0.7)',
                bgcolor: layer.active ? '#00bcd4' : 'rgba(255,255,255,0.1)'
              }}
            />
          ))}
        </Paper>

        {/* Measurement Info */}
        {measurementMode && (
          <Paper
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 1000,
              p: 2,
              minWidth: 200,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Measurement Mode
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click on the map to add measurement points
            </Typography>
            <Typography variant="body2">
              Points: {markers.length}
            </Typography>
            {markers.length >= 2 && (
              <Typography variant="body2">
                Total Distance: {calculateDistance()} km
              </Typography>
            )}
            {markers.length > 0 && (
              <Button
                size="small"
                onClick={clearMarkers}
                sx={{ mt: 1, color: '#00bcd4' }}
              >
                Clear Points
              </Button>
            )}
          </Paper>
        )}

        {/* Coordinate Display */}
        <Paper
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            p: 1,
            px: 2,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            color: 'white'
          }}
        >
          <Typography variant="caption">
            Lat: {position[0].toFixed(4)} Lng: {position[1].toFixed(4)} Zoom: {zoom}
          </Typography>
        </Paper>
      </Box>

      {/* Right Sidebar - Layers, Analysis, Alerts */}
      <Paper
        sx={{
          width: 320,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(26,26,26,0.95)',
          backdropFilter: 'blur(10px)',
          borderLeft: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Tab Headers */}
        <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Button
            onClick={() => { setShowLayersPanel(true); setShowAnalysisPanel(false); setShowAlertsPanel(false); }}
            sx={{ 
              flex: 1, 
              color: showLayersPanel ? '#00bcd4' : 'rgba(255,255,255,0.7)',
              borderBottom: showLayersPanel ? '2px solid #00bcd4' : 'none'
            }}
          >
            Layers
          </Button>
          <Button
            onClick={() => { setShowLayersPanel(false); setShowAnalysisPanel(true); setShowAlertsPanel(false); }}
            sx={{ 
              flex: 1, 
              color: showAnalysisPanel ? '#00bcd4' : 'rgba(255,255,255,0.7)',
              borderBottom: showAnalysisPanel ? '2px solid #00bcd4' : 'none'
            }}
          >
            Analysis
          </Button>
          <Button
            onClick={() => { setShowLayersPanel(false); setShowAnalysisPanel(false); setShowAlertsPanel(true); }}
            sx={{ 
              flex: 1, 
              color: showAlertsPanel ? '#00bcd4' : 'rgba(255,255,255,0.7)',
              borderBottom: showAlertsPanel ? '2px solid #00bcd4' : 'none'
            }}
          >
            Alerts
          </Button>
        </Box>

        {/* Layers Panel */}
        {showLayersPanel && (
          <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Map Layers
            </Typography>
            
            {/* Base Layers */}
            <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Typography sx={{ color: 'white' }}>Base Layers</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {mapLayers.map((layer) => (
                    <ListItem key={layer.name} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {layer.name === 'Satellite' && <SatelliteIcon sx={{ color: 'white' }} />}
                        {layer.name === 'Terrain' && <TerrainIcon sx={{ color: 'white' }} />}
                        {layer.name === 'OpenStreetMap' && <MapIcon sx={{ color: 'white' }} />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={layer.name}
                        sx={{ color: 'white' }}
                      />
                      <Switch
                        checked={layer.active}
                        onChange={() => switchLayer(layer.name)}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Data Layers */}
            <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Typography sx={{ color: 'white' }}>Data Layers</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {dataLayers.map((layer, index) => (
                    <ListItem key={layer.name} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            bgcolor: layer.color,
                            borderRadius: '50%'
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={layer.name}
                        secondary={layer.description}
                        sx={{ 
                          color: 'white',
                          '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.6)' }
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={layer.visible}
                          onChange={(e) => {
                            const newLayers = [...dataLayers];
                            newLayers[index].visible = e.target.checked;
                            setDataLayers(newLayers);
                          }}
                          size="small"
                        />
                        <Slider
                          value={layer.opacity * 100}
                          onChange={(e, value) => {
                            const newLayers = [...dataLayers];
                            newLayers[index].opacity = value / 100;
                            setDataLayers(newLayers);
                          }}
                          size="small"
                          sx={{ width: 60 }}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>

            {/* Raster Data */}
            <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Typography sx={{ color: 'white' }}>Raster Data</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    sx={{ bgcolor: '#00bcd4' }}
                  >
                    Add Layer
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    sx={{ borderColor: '#00bcd4', color: '#00bcd4' }}
                  >
                    Save
                  </Button>
                </Box>
                <List dense>
                  {rasterData.map((data, index) => (
                    <ListItem key={data.name} sx={{ px: 0 }}>
                      <ListItemText 
                        primary={data.name}
                        secondary={`${data.bands} bands, ${data.resolution}, ${data.date}`}
                        sx={{ 
                          color: 'white',
                          '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.6)' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Analysis Panel */}
        {showAnalysisPanel && (
          <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Spatial Analysis
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              Advanced geoprocessing tools and analysis capabilities.
            </Typography>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              sx={{ mb: 2, borderColor: '#00bcd4', color: '#00bcd4' }}
            >
              Buffer Analysis
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              sx={{ mb: 2, borderColor: '#00bcd4', color: '#00bcd4' }}
            >
              Intersection
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              sx={{ mb: 2, borderColor: '#00bcd4', color: '#00bcd4' }}
            >
              Proximity Analysis
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AnalyticsIcon />}
              sx={{ mb: 2, borderColor: '#00bcd4', color: '#00bcd4' }}
            >
              Overlay Analysis
            </Button>
          </Box>
        )}

        {/* Alerts Panel */}
        {showAlertsPanel && (
          <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
              Disaster Alerts
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              Real-time monitoring and alert system.
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)' }}>
              <Typography variant="body2" sx={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                High Risk Alert
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Earthquake detected in region
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)' }}>
              <Typography variant="body2" sx={{ color: '#ffa500', fontWeight: 'bold' }}>
                Medium Risk Alert
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Flood warning in coastal areas
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>

      {/* Success Message */}
      <Paper
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          p: 1,
          px: 2,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          display: measurementMode ? 'none' : 'block'
        }}
      >
        <Typography variant="caption" sx={{ color: '#4caf50' }}>
          Success - Loaded GeoTIFF imagery with 4 bands
        </Typography>
      </Paper>
    </Box>
  );
};

export default MapView;

