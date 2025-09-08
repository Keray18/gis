import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Box, Paper, Typography, Button, IconButton, Tooltip, Chip, TextField, InputAdornment } from '@mui/material';
import { 
  MyLocation as MyLocationIcon, 
  ZoomIn as ZoomInIcon, 
  ZoomOut as ZoomOutIcon,
  Search as SearchIcon,
  Straighten as MeasureIcon,
  Add as AddIcon,
  Layers as LayersIcon
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
  const [position, setPosition] = useState([28.6139, 77.2090]); // Default to Delhi
  const [zoom, setZoom] = useState(10);
  const [markers, setMarkers] = useState([]);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapLayers, setMapLayers] = useState([
    { name: 'OpenStreetMap', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', active: true },
    { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', active: false },
    { name: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', active: false }
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
    <Box sx={{ height: '100%', position: 'relative' }}>
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapRef />
        <MapEvents />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={getActiveLayer()?.url}
        />

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
      </MapContainer>

      {/* Search Bar */}
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
          gap: 1
        }}
      >
        <TextField
          fullWidth
          placeholder="Search locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" size="small">
          Search
        </Button>
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
          gap: 1
        }}
      >
        <Tooltip title="My Location">
          <IconButton onClick={handleLocationClick} color="primary">
            <MyLocationIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom In">
          <IconButton onClick={handleZoomIn} color="primary">
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Zoom Out">
          <IconButton onClick={handleZoomOut} color="primary">
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={measurementMode ? "Exit Measurement" : "Start Measurement"}>
          <IconButton 
            onClick={toggleMeasurementMode} 
            color={measurementMode ? "secondary" : "primary"}
          >
            <MeasureIcon />
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
          gap: 1
        }}
      >
        {mapLayers.map((layer) => (
          <Chip
            key={layer.name}
            label={layer.name}
            onClick={() => switchLayer(layer.name)}
            color={layer.active ? "primary" : "default"}
            size="small"
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
            minWidth: 200
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
              sx={{ mt: 1 }}
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
          px: 2
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Zoom: {zoom} | Lat: {position[0].toFixed(4)} | Lng: {position[1].toFixed(4)}
        </Typography>
      </Paper>
    </Box>
  );
};

export default MapView;
