import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle, Polygon, Polyline } from 'react-leaflet';
import GeometryOperations from './GeometryOperations';
import QueryPanel from './QueryPanel';
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
  Badge,
  Backdrop,
  CircularProgress
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
  Home as HomeIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import { listLayers, getLayerFeatures, queryLayerAttribute, queryLayerBuffer, queryPointInPolygon, createFeature, updateFeature, deleteFeature, getRasterTileUrl, updateRasterStyling, listDatasets } from '../services/api';
import RasterStylePanel from './RasterStylePanel';
import TerrainAnalysisPanel from './TerrainAnalysisPanel';

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
  
  // Location pinpointing states
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isFlyingHome, setIsFlyingHome] = useState(false);
  const locationWatchIdRef = useRef(null);
  const locationWatchTimeoutRef = useRef(null);
  
  // Click marker states
  const [clickMarker, setClickMarker] = useState(null);
  const [clickMarkerPosition, setClickMarkerPosition] = useState(null);
  
  // Query results state
  const [queryResults, setQueryResults] = useState(null);
  const [highlightedFeatures, setHighlightedFeatures] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]); // Track analysis results
  const [loadedClippings, setLoadedClippings] = useState([]); // Track loaded clippings
  
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
      description: 'Population density visualization',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Demographics/USA_Population_Density/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri'
    },
    { 
      name: 'Transportation', 
      visible: true, 
      opacity: 0.8, 
      type: 'vector',
      color: '#4ecdc4',
      description: 'Transportation networks',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri'
    },
    { 
      name: 'Land Use', 
      visible: false, 
      opacity: 0.6, 
      type: 'raster',
      color: '#45b7d1',
      description: 'Land use classification',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri'
    },
    { 
      name: 'Elevation', 
      visible: false, 
      opacity: 0.5, 
      type: 'raster',
      color: '#96ceb4',
      description: 'Digital elevation model',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri'
    }
  ]);

  const [rasterData, setRasterData] = useState([
    { name: 'Landsat 8', bands: 4, resolution: '30m', date: '2024-01-15' },
    { name: 'Sentinel-2', bands: 13, resolution: '10m', date: '2024-01-10' }
  ]);

  const mapRef = useRef();

  const [serverLayers, setServerLayers] = useState([]);
  const [serverLayerFeatures, setServerLayerFeatures] = useState({}); // layerId -> FeatureCollection
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLayerForStyling, setSelectedLayerForStyling] = useState(null);
  const [editingMode, setEditingMode] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [rasterStylePanel, setRasterStylePanel] = useState({ open: false, layer: null });
  const [terrainAnalysisPanel, setTerrainAnalysisPanel] = useState({ open: false, dataset: null });

  const handleRasterStyleUpdate = async (style) => {
    if (!rasterStylePanel.layer) return;
    
    console.log('Updating raster style:', style);
    console.log('Layer:', rasterStylePanel.layer);
    
    try {
      const response = await updateRasterStyling(rasterStylePanel.layer._id, style);
      console.log('Style update response:', response);
      
      // Only update the specific raster layer's style, preserve other layers' state
      setServerLayers(prev => {
        const updatedLayers = prev.map(layer => {
          if (layer._id === rasterStylePanel.layer._id) {
            // Update only the raster layer with new style
            const updatedLayer = {
              ...layer,
              style: {
                ...layer.style,
                raster: style
              },
              _styleUpdate: Date.now() // Force re-render
            };
            // Update the raster style panel layer reference
            setRasterStylePanel({ open: true, layer: updatedLayer });
            return updatedLayer;
          }
          // Preserve all other layers (including vector layers) as-is
          return layer;
        });
        return updatedLayers;
      });
      
      console.log('Raster style updated successfully - tiles should refresh');
      
      // Force map to invalidate size and refresh tiles
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current.invalidateSize();
          // Force tile refresh by triggering a zoom event
          mapRef.current.setZoom(mapRef.current.getZoom());
        }, 200);
      }
    } catch (error) {
      console.error('Error updating raster style:', error);
    }
  };

  const openRasterStylePanel = (layer) => {
    setRasterStylePanel({ open: true, layer });
  };

  const closeRasterStylePanel = () => {
    setRasterStylePanel({ open: false, layer: null });
  };

  const openTerrainAnalysisPanel = async (layer) => {
    // Get the dataset from the layer
    try {
      const datasetsResp = await listDatasets();
      const datasets = datasetsResp?.data?.datasets || [];
      const dataset = datasets.find(d => 
        (d._id || d.id) === (layer.source?.datasetId?._id || layer.source?.datasetId || layer.source?.datasetId?.id)
      );
      
      if (dataset) {
        setTerrainAnalysisPanel({ open: true, dataset });
      } else {
        console.error('Dataset not found for layer:', layer);
      }
    } catch (error) {
      console.error('Error opening terrain analysis panel:', error);
    }
  };

  const closeTerrainAnalysisPanel = () => {
    setTerrainAnalysisPanel({ open: false, dataset: null });
  };

  const handleTerrainAnalysisComplete = async (result) => {
    // Refresh layers after terrain analysis
    try {
      const resp = await listLayers();
      const layers = resp?.data?.layers || resp?.data || [];
      // Preserve existing visibility state when refreshing
      setServerLayers(prevLayers => {
        const prevMap = new Map(prevLayers.map(l => [l._id, l]));
        return layers.map(l => ({
          ...l,
          visible: prevMap.has(l._id) 
            ? prevMap.get(l._id).visible  // Preserve existing visibility
            : (l.type === 'raster' ? true : false)  // Default: raster visible, vector hidden
        }));
      });
      
      // Preload features for new layers
      for (const l of layers) {
        if (l.type !== 'raster') {
          try {
            const fc = await getLayerFeatures(l._id, { limit: 1000 });
            setServerLayerFeatures(prev => ({ ...prev, [l._id]: fc?.data || fc }));
          } catch (_) {}
        }
      }
    } catch (error) {
      console.error('Error refreshing layers after terrain analysis:', error);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const resp = await listLayers();
        const layers = resp?.data?.layers || resp?.data || [];
        console.log('Layers API response:', resp);
        console.log('Layers array:', layers);
        // On initial load: vector layers default to false (hidden), raster to true (visible)
        setServerLayers(layers.map(l => ({ 
          ...l, 
          visible: l.type === 'raster' ? true : false
        })));
        // Preload small feature sets
        for (const l of layers) {
          try {
            // Only get features for vector layers, not raster layers
            if (l.type !== 'raster') {
              const fc = await getLayerFeatures(l._id, { limit: 1000 });
              setServerLayerFeatures(prev => ({ ...prev, [l._id]: fc?.data || fc }));
            }
          } catch (_) {}
        }
      } catch (_) {}
    })();
  }, []);

  // Load clippings from localStorage and listen for updates
  useEffect(() => {
    const loadClippings = () => {
      try {
        const stored = localStorage.getItem('loadedClippings');
        if (stored) {
          const clippings = JSON.parse(stored);
          setLoadedClippings(clippings);
        }
      } catch (error) {
        console.error('Error loading clippings from localStorage:', error);
      }
    };

    // Load on mount
    loadClippings();

    // Listen for storage events (when clippings are loaded from another tab/component)
    const handleStorageChange = (e) => {
      if (e.key === 'loadedClippings') {
        loadClippings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event (for same-tab updates)
    const handleClippingLoaded = () => {
      loadClippings();
    };
    window.addEventListener('clippingLoaded', handleClippingLoaded);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('clippingLoaded', handleClippingLoaded);
    };
  }, []);

  // Component to handle map events
  const MapEvents = () => {
    const map = useMap();
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        
        if (measurementMode) {
          const newMarker = {
            id: Date.now(),
            position: [lat, lng],
            timestamp: new Date().toISOString()
          };
          setMarkers(prev => [...prev, newMarker]);
        } else {
          // Click to place marker functionality
          const markerData = {
            lat: lat,
            lng: lng,
            timestamp: new Date().toISOString()
          };
          setClickMarker(markerData);
          setClickMarkerPosition([lat, lng]);
          setPosition([lat, lng]); // Update center position
        }
      },
      zoomend: (e) => {
        setZoom(e.target.getZoom());
      },
      moveend: () => {
        if (isFlyingHome) setIsFlyingHome(false);
        if (isLocating) setIsLocating(false);
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
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    // Quick permission check to fail fast if denied
    try {
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'denied') {
            setLocationError('Location is blocked. Please allow location access in your browser settings.');
            setIsLocating(false);
          }
        }).catch(() => {});
      }
    } catch (_) {}

    // 1) Immediate feedback: fly to last known location if available
    if (userLocation && mapRef.current) {
      const target = [userLocation.lat, userLocation.lng];
      const targetZoom = Math.max(mapRef.current.getZoom() || 12, 15);
      mapRef.current.flyTo(target, targetZoom, { duration: 0.8, easeLinearity: 0.25 });
    }

    // 2) Quick coarse fix using cached location (fast response)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationData = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
          timestamp: new Date().toISOString()
        };
        setUserLocation(locationData);
        setLocationAccuracy(accuracy);
        setPosition([latitude, longitude]);
        if (mapRef.current) {
          const targetZoom = Math.max(mapRef.current.getZoom() || 12, 15);
          mapRef.current.flyTo([latitude, longitude], targetZoom, { duration: 0.9, easeLinearity: 0.25 });
        }
      },
      (/* err */) => {
        // ignore quick-fix failure; we'll rely on high-accuracy watch below
      },
      { enableHighAccuracy: false, timeout: 1500, maximumAge: 300000 }
    );

    // 3) High-accuracy refinement via watchPosition; clear after first precise fix
    if (locationWatchIdRef.current !== null) {
      try { navigator.geolocation.clearWatch(locationWatchIdRef.current); } catch (_) {}
      locationWatchIdRef.current = null;
    }
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationData = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
          timestamp: new Date().toISOString()
        };
        setUserLocation(locationData);
        setLocationAccuracy(accuracy);
        setPosition([latitude, longitude]);
        if (mapRef.current) {
          const targetZoom = Math.max(mapRef.current.getZoom() || 12, 16);
          mapRef.current.flyTo([latitude, longitude], targetZoom, { duration: 1.1, easeLinearity: 0.25 });
        }
        if (locationWatchIdRef.current !== null) {
          try { navigator.geolocation.clearWatch(locationWatchIdRef.current); } catch (_) {}
          locationWatchIdRef.current = null;
        }
        if (locationWatchTimeoutRef.current) {
          clearTimeout(locationWatchTimeoutRef.current);
          locationWatchTimeoutRef.current = null;
        }
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location services and allow access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        setLocationError(errorMessage);
        setIsLocating(false);
        if (locationWatchIdRef.current !== null) {
          try { navigator.geolocation.clearWatch(locationWatchIdRef.current); } catch (_) {}
          locationWatchIdRef.current = null;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Hard cutoff so UI doesn't hang if watch never resolves
    if (locationWatchTimeoutRef.current) {
      clearTimeout(locationWatchTimeoutRef.current);
    }
    locationWatchTimeoutRef.current = setTimeout(() => {
      if (locationWatchIdRef.current !== null) {
        try { navigator.geolocation.clearWatch(locationWatchIdRef.current); } catch (_) {}
        locationWatchIdRef.current = null;
      }
      // If we already have a coarse or cached location, don't alarm the user
      if (!userLocation) {
        setLocationError('Unable to get your location. Location request timed out.');
      }
      setIsLocating(false);
      locationWatchTimeoutRef.current = null;
    }, 7000);
  };

  // Cleanup any outstanding geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current !== null) {
        try { navigator.geolocation.clearWatch(locationWatchIdRef.current); } catch (_) {}
        locationWatchIdRef.current = null;
      }
      if (locationWatchTimeoutRef.current) {
        clearTimeout(locationWatchTimeoutRef.current);
        locationWatchTimeoutRef.current = null;
      }
    };
  }, []);

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
      active: layer.name === layerName && layer.type === 'base'
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
          
          {/* Base Map Layers */}
          {mapLayers.map((layer) => (
          <TileLayer
              key={layer.name}
              attribution={layer.attribution}
              url={layer.url}
              opacity={layer.active ? layerOpacity / 100 : 0}
              zIndex={layer.active ? 1 : 0}
            />
          ))}

          {/* Data Layers */}
          {dataLayers.filter(layer => layer.visible).map((layer, index) => (
            <TileLayer
              key={layer.name}
              url={layer.url}
              attribution={layer.attribution}
              opacity={layer.opacity}
              zIndex={1000 + index}
            />
          ))}

          {/* Server Raster Layers */}
          {serverLayers.filter(l => l.visible && l.type === 'raster').map((l, idx) => {
            if (!l.source?.datasetId) return null;
            
            const rasterStyle = l.style?.raster || {};
            const styleOptions = {
              colorRamp: rasterStyle.colorRamp || 'viridis',
              stretchType: rasterStyle.stretchType || 'linear',
              opacity: rasterStyle.opacity || 1.0,
              bands: rasterStyle.bands ? [rasterStyle.bands.red, rasterStyle.bands.green, rasterStyle.bands.blue] : [0, 1, 2],
              minValue: rasterStyle.stretchParams?.minValue,
              maxValue: rasterStyle.stretchParams?.maxValue,
              blendingMode: rasterStyle.blendingMode || 'normal'
            };
            
            console.log(`Rendering raster layer ${l.name} with style:`, styleOptions);
            
            // Create a style hash for cache-busting and key uniqueness
            const styleHash = JSON.stringify(styleOptions);
            const tileUrl = getRasterTileUrl(l.source.datasetId._id || l.source.datasetId, '{z}', '{x}', '{y}', styleOptions);
            
            return (
              <TileLayer
                key={`raster-${l._id}-${styleHash}`}
                url={tileUrl}
                opacity={rasterStyle.opacity || 1.0}
                zIndex={1000 + idx}
                attribution={`Raster layer: ${l.name}`}
                updateWhenZooming={false}
                updateWhenIdle={true}
                keepBuffer={2}
              />
            );
          })}

          {/* Server Vector Layers (simple styled) */}
          {serverLayers.filter(l => l.visible && l.type !== 'raster').map((l, idx) => {
            const fc = serverLayerFeatures[l._id];
            if (!fc || !fc.features) return null;
            return fc.features.map((f, i) => {
              const color = l?.style?.simple?.color || '#00bcd4';
              const weight = l?.style?.simple?.weight || 2;
              const fillOpacity = l?.style?.simple?.fillOpacity ?? 0.3;
              if (f.geometry?.type === 'Point') {
                const [lng, lat] = f.geometry.coordinates;
                return (
                  <Marker 
                    key={`${l._id}-pt-${i}`} 
                    position={[lat, lng]}
                    eventHandlers={{
                      click: () => {
                        if (editingMode) {
                          setSelectedFeature({ ...f, layerId: l._id, layerName: l.name });
                        }
                      }
                    }}
                  >
                    <Popup>
                      <Typography variant="caption">{l.name}</Typography>
                      {editingMode && (
                        <Box sx={{ mt: 1 }}>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => setSelectedFeature({ ...f, layerId: l._id, layerName: l.name })}
                          >
                            Edit
                          </Button>
                        </Box>
                      )}
                    </Popup>
                  </Marker>
                );
              }
              if (f.geometry?.type === 'LineString') {
                const positions = f.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                return (
                  <Polyline key={`${l._id}-ln-${i}`} positions={positions} pathOptions={{ color, weight }} />
                );
              }
              if (f.geometry?.type === 'Polygon') {
                const positions = f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
                return (
                  <Polygon key={`${l._id}-pg-${i}`} positions={positions} pathOptions={{ color, weight, fillOpacity }} />
                );
              }
              return null;
            });
          })}

          {/* Query Results Highlighting */}
          {highlightedFeatures.map((f, i) => {
            const highlightColor = '#ff6b6b'; // Red highlight color
            const highlightWeight = 4;
            const highlightFillOpacity = 0.6;
            
            if (f.geometry?.type === 'Point') {
              const [lng, lat] = f.geometry.coordinates;
              return (
                <Marker 
                  key={`query-result-pt-${i}`} 
                  position={[lat, lng]}
                  icon={L.divIcon({
                    className: 'query-result-marker',
                    html: `<div style="
                      width: 20px; 
                      height: 20px; 
                      background-color: ${highlightColor}; 
                      border: 3px solid white; 
                      border-radius: 50%; 
                      box-shadow: 0 0 10px rgba(255, 107, 107, 0.8);
                    "></div>`,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  })}
                >
                  <Popup>
                    <Typography variant="subtitle2" color="primary">
                      Query Result
                    </Typography>
                    <Typography variant="body2">
                      Feature {i + 1} of {highlightedFeatures.length}
                    </Typography>
                    {f.properties && Object.keys(f.properties).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(f.properties).slice(0, 3).map(([key, value]) => (
                          <Typography key={key} variant="caption" display="block">
                            <strong>{key}:</strong> {String(value)}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Popup>
                </Marker>
              );
            }
            if (f.geometry?.type === 'LineString') {
              const positions = f.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
              return (
                <Polyline 
                  key={`query-result-ln-${i}`} 
                  positions={positions} 
                  pathOptions={{ 
                    color: highlightColor, 
                    weight: highlightWeight,
                    opacity: 0.8
                  }} 
                />
              );
            }
            if (f.geometry?.type === 'MultiLineString') {
              const positions = f.geometry.coordinates.map(line => line.map(([lng, lat]) => [lat, lng]));
              return (
                <Polyline 
                  key={`query-result-mln-${i}`} 
                  positions={positions} 
                  pathOptions={{ 
                    color: highlightColor, 
                    weight: highlightWeight,
                    opacity: 0.8
                  }} 
                />
              );
            }
            if (f.geometry?.type === 'Polygon') {
              const positions = f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
              return (
                <Polygon 
                  key={`query-result-pg-${i}`} 
                  positions={positions} 
                  pathOptions={{ 
                    color: highlightColor, 
                    weight: highlightWeight, 
                    fillOpacity: highlightFillOpacity,
                    opacity: 0.8
                  }} 
                />
              );
            }
            if (f.geometry?.type === 'MultiPolygon') {
              const positions = f.geometry.coordinates.map(poly => poly[0].map(([lng, lat]) => [lat, lng]));
              return (
                <Polygon 
                  key={`query-result-mpg-${i}`} 
                  positions={positions} 
                  pathOptions={{ 
                    color: highlightColor, 
                    weight: highlightWeight, 
                    fillOpacity: highlightFillOpacity,
                    opacity: 0.8
                  }} 
                />
              );
            }
            if (f.geometry?.type === 'GeometryCollection' && Array.isArray(f.geometry.geometries)) {
              return f.geometry.geometries.map((g, gi) => {
                const gf = { type: 'Feature', geometry: g, properties: f.properties };
                const key = `query-result-gc-${i}-${gi}`;
                if (g.type === 'Point') {
                  const [lng, lat] = g.coordinates;
                  return <Marker key={key} position={[lat, lng]} />;
                }
                if (g.type === 'LineString') {
                  const positions = g.coordinates.map(([lng, lat]) => [lat, lng]);
                  return <Polyline key={key} positions={positions} pathOptions={{ color: highlightColor, weight: highlightWeight, opacity: 0.8 }} />;
                }
                if (g.type === 'MultiLineString') {
                  const positions = g.coordinates.map(line => line.map(([lng, lat]) => [lat, lng]));
                  return <Polyline key={key} positions={positions} pathOptions={{ color: highlightColor, weight: highlightWeight, opacity: 0.8 }} />;
                }
                if (g.type === 'Polygon') {
                  const positions = g.coordinates[0].map(([lng, lat]) => [lat, lng]);
                  return <Polygon key={key} positions={positions} pathOptions={{ color: highlightColor, weight: highlightWeight, fillOpacity: highlightFillOpacity, opacity: 0.8 }} />;
                }
                if (g.type === 'MultiPolygon') {
                  const positions = g.coordinates.map(poly => poly[0].map(([lng, lat]) => [lat, lng]));
                  return <Polygon key={key} positions={positions} pathOptions={{ color: highlightColor, weight: highlightWeight, fillOpacity: highlightFillOpacity, opacity: 0.8 }} />;
                }
                return null;
              });
            }
            return null;
          })}

          {/* User Location Marker */}
          {userLocation && (
            <>
              <Marker 
                position={[userLocation.lat, userLocation.lng]}
                icon={L.divIcon({
                  className: 'custom-location-marker',
                  html: `
                    <div style="
                      background: #00bcd4;
                      border: 3px solid white;
                      border-radius: 50%;
                      width: 20px;
                      height: 20px;
                      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                      position: relative;
                    ">
                      <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        border-radius: 50%;
                        width: 8px;
                        height: 8px;
                      "></div>
                    </div>
                  `,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>
                  <Typography variant="body2">
                    <strong>Your Location</strong><br />
                    <strong>Coordinates:</strong><br />
                    Lat: {userLocation.lat.toFixed(6)}<br />
                    Lng: {userLocation.lng.toFixed(6)}<br />
                    <strong>Accuracy:</strong> ±{Math.round(userLocation.accuracy)}m<br />
                    <strong>Time:</strong> {new Date(userLocation.timestamp).toLocaleString()}
                  </Typography>
                </Popup>
              </Marker>
              
              {/* Accuracy Circle */}
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={userLocation.accuracy}
                pathOptions={{
                  color: '#00bcd4',
                  fillColor: '#00bcd4',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 5'
                }}
              />
            </>
          )}

          {/* Click Marker */}
          {clickMarker && (
            <Marker 
              position={[clickMarker.lat, clickMarker.lng]}
              icon={L.divIcon({
                className: 'custom-click-marker',
                html: `
                  <div style="
                    background: #ff4081;
                    border: 3px solid white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <div style="
                      color: white;
                      font-weight: bold;
                      font-size: 12px;
                      line-height: 1;
                    ">📍</div>
                  </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })}
            >
              <Popup>
                <Typography variant="body2">
                  <strong>Selected Location</strong><br />
                  <strong>Coordinates:</strong><br />
                  Lat: {clickMarker.lat.toFixed(6)}<br />
                  Lng: {clickMarker.lng.toFixed(6)}<br />
                  <strong>Time:</strong> {new Date(clickMarker.timestamp).toLocaleString()}
                </Typography>
              </Popup>
            </Marker>
          )}

          {/* Measurement Markers */}
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

          {/* Loaded Clippings */}
          {loadedClippings.map((clipping, clipIdx) => {
            if (!clipping.features || clipping.features.length === 0) return null;
            
            const clippingColor = clipping.style?.color || '#00bcd4'; // Cyan color for clippings
            const clippingWeight = clipping.style?.weight || 3;
            const clippingFillOpacity = clipping.style?.fillOpacity ?? 0.4;
            
            return clipping.features.map((f, i) => {
              if (f.geometry?.type === 'Point') {
                const [lng, lat] = f.geometry.coordinates;
                return (
                  <Marker 
                    key={`clipping-${clipIdx}-pt-${i}`} 
                    position={[lat, lng]}
                    icon={L.divIcon({
                      className: 'clipping-marker',
                      html: `<div style="
                        width: 16px; 
                        height: 16px; 
                        background-color: ${clippingColor}; 
                        border: 2px solid white; 
                        border-radius: 50%; 
                        box-shadow: 0 0 8px rgba(0, 188, 212, 0.6);
                      "></div>`,
                      iconSize: [16, 16],
                      iconAnchor: [8, 8]
                    })}
                  >
                    <Popup>
                      <Typography variant="subtitle2" sx={{ color: clippingColor }}>
                        {clipping.name}
                      </Typography>
                      <Typography variant="body2">
                        Feature {i + 1} of {clipping.features.length}
                      </Typography>
                      {f.properties && Object.keys(f.properties).length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {Object.entries(f.properties).slice(0, 3).map(([key, value]) => (
                            <Typography key={key} variant="caption" display="block">
                              <strong>{key}:</strong> {String(value)}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Popup>
                  </Marker>
                );
              }
              if (f.geometry?.type === 'LineString') {
                const positions = f.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
                return (
                  <Polyline 
                    key={`clipping-${clipIdx}-ln-${i}`} 
                    positions={positions} 
                    pathOptions={{ 
                      color: clippingColor, 
                      weight: clippingWeight,
                      opacity: 0.9
                    }} 
                  />
                );
              }
              if (f.geometry?.type === 'Polygon') {
                const positions = f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
                return (
                  <Polygon 
                    key={`clipping-${clipIdx}-pg-${i}`} 
                    positions={positions} 
                    pathOptions={{ 
                      color: clippingColor, 
                      weight: clippingWeight,
                      fillColor: clippingColor,
                      fillOpacity: clippingFillOpacity,
                      opacity: 0.9
                    }} 
                  >
                    <Popup>
                      <Typography variant="subtitle2" sx={{ color: clippingColor }}>
                        {clipping.name}
                      </Typography>
                      <Typography variant="body2">
                        Feature {i + 1} of {clipping.features.length}
                      </Typography>
                      {f.properties && Object.keys(f.properties).length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {Object.entries(f.properties).slice(0, 3).map(([key, value]) => (
                            <Typography key={key} variant="caption" display="block">
                              <strong>{key}:</strong> {String(value)}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Popup>
                  </Polygon>
                );
              }
              return null;
            });
          })}
        </MapContainer>

        {/* Top Search Bar */}
        <Paper
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            minWidth: 400,
            maxWidth: 600
          }}
        >
          <TextField
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ 
              flex: 1,
              '& .MuiOutlinedInput-root': { 
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                </InputAdornment>
              ),
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                // Trigger search
                e.target.blur();
              }
            }}
          />
          <Button 
            variant="contained" 
            size="small" 
            sx={{ 
              bgcolor: '#00bcd4',
              '&:hover': { bgcolor: '#00acc1' },
              minWidth: 80
            }}
            onClick={async () => {
              if (!searchQuery.trim()) return;
              try {
                setSearchResults([]);
                // Simple attribute search across all layers
                for (const layer of serverLayers) {
                  try {
                    const results = await queryLayerAttribute(layer._id, { 
                      field: 'name', 
                      regex: searchQuery 
                    });
                    if (results?.data?.features?.length > 0) {
                      setSearchResults(prev => [...prev, ...results.data.features]);
                    }
                  } catch (_) {}
                }
              } catch (_) {}
            }}
          >
            Search
          </Button>
        </Paper>

        {/* Map Controls */}
        <Paper
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2
          }}
        >
          <Tooltip title="Home">
            <IconButton onClick={() => {
              const home = [37.7749, -122.4194];
              setIsFlyingHome(true);
              setPosition(home);
              if (mapRef.current) {
                mapRef.current.flyTo(home, mapRef.current.getZoom(), { duration: 1.2, easeLinearity: 0.25 });
              }
            }} sx={{ color: 'white', animation: isFlyingHome ? 'pulse 1.2s ease-in-out infinite' : 'none' }}>
              <HomeIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isLocating ? "Locating..." : "My Location"}>
            <IconButton 
              onClick={handleLocationClick} 
              disabled={isLocating}
              sx={{ 
                color: isLocating ? '#ffa500' : 'white',
                animation: isLocating ? 'pulse 1.5s ease-in-out infinite' : 'none'
              }}
            >
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
          
          <Tooltip title="Clear Marker">
            <IconButton 
              onClick={() => {
                setClickMarker(null);
                setClickMarkerPosition(null);
              }} 
              disabled={!clickMarker}
              sx={{ 
                color: clickMarker ? '#ff4081' : 'rgba(255,255,255,0.3)',
                opacity: clickMarker ? 1 : 0.5
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Toggle Edit Mode">
            <IconButton 
              onClick={() => setEditingMode(!editingMode)}
              sx={{ 
                color: editingMode ? '#ff4081' : 'white',
                bgcolor: editingMode ? 'rgba(255,64,129,0.2)' : 'transparent'
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Clear Query Results">
            <IconButton 
              onClick={() => setHighlightedFeatures([])}
              disabled={highlightedFeatures.length === 0}
              sx={{ 
                color: highlightedFeatures.length > 0 ? '#ff6b6b' : 'rgba(255,255,255,0.3)',
                opacity: highlightedFeatures.length > 0 ? 1 : 0.5
              }}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh">
            <IconButton onClick={() => window.location.reload()} sx={{ color: 'white' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Paper>

        {/* Layer Switcher - Compact */}
        <Paper
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 1000,
            p: 1.5,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            minWidth: 180
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, display: 'block', fontWeight: 500 }}>
            Base Map
          </Typography>
          {mapLayers.map((layer) => (
            <Box 
              key={layer.name} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 0.5,
                p: 0.5,
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
              }}
              onClick={() => switchLayer(layer.name)}
            >
              <Box sx={{ mr: 1, color: 'rgba(255,255,255,0.8)' }}>
                {layer.name === 'Satellite' && <SatelliteIcon sx={{ fontSize: 18 }} />}
                {layer.name === 'OpenStreetMap' && <MapIcon sx={{ fontSize: 18 }} />}
                {layer.name === 'Terrain' && <TerrainIcon sx={{ fontSize: 18 }} />}
                {layer.name === 'Hybrid' && <MapIcon sx={{ fontSize: 18 }} />}
                {layer.name === 'Dark' && <MapIcon sx={{ fontSize: 18 }} />}
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: layer.active ? 'white' : 'rgba(255,255,255,0.6)', 
                  flexGrow: 1,
                  fontSize: '0.875rem',
                  fontWeight: layer.active ? 500 : 400
                }}
              >
                {layer.name}
              </Typography>
              <Switch
                checked={layer.active}
                onChange={() => switchLayer(layer.name)}
                size="small"
                sx={{ 
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#00bcd4',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#00bcd4',
                  },
                }}
              />
            </Box>
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

        {/* Location Error Display */}
        {locationError && (
          <Paper
            sx={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              p: 2,
              px: 3,
              background: 'rgba(244, 67, 54, 0.9)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              maxWidth: 400,
              textAlign: 'center'
            }}
          >
            <Typography variant="body2">
              {locationError}
            </Typography>
            <Button
              size="small"
              onClick={() => setLocationError(null)}
              sx={{ color: 'white', mt: 1 }}
            >
              Dismiss
            </Button>
          </Paper>
        )}

        {/* Location Status Display */}
        {userLocation && (
          <Paper
            sx={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              p: 1,
              px: 2,
              background: 'rgba(76, 175, 80, 0.9)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <MyLocationIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">
              Location found! Accuracy: ±{Math.round(userLocation.accuracy)}m
            </Typography>
            <Button
              size="small"
              onClick={() => setUserLocation(null)}
              sx={{ color: 'white', minWidth: 'auto', p: 0.5 }}
            >
              ×
            </Button>
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
            {clickMarker ? (
              <>
                <strong>Selected:</strong> Lat: {clickMarker.lat.toFixed(6)} Lng: {clickMarker.lng.toFixed(6)} | 
                Zoom: {zoom}
              </>
            ) : (
              <>
                Center: Lat: {position[0].toFixed(4)} Lng: {position[1].toFixed(4)} | Zoom: {zoom}
              </>
            )}
          </Typography>
        </Paper>

        {/* Global loading overlay for transitions */}
        <Backdrop open={isLocating || isFlyingHome} sx={{ color: '#fff', zIndex: 1200, background: 'rgba(0,0,0,0.2)' }}>
          <CircularProgress color="inherit" size={36} />
        </Backdrop>
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

            {/* Server Vector Layers */}
            <Accordion sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
                <Typography sx={{ color: 'white' }}>Uploaded Vector Layers</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {serverLayers.filter(l => l.type !== 'raster').map((l, idx) => (
                    <ListItem key={l._id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Box sx={{ width: 16, height: 16, bgcolor: l?.style?.simple?.color || '#00bcd4', borderRadius: '50%' }} />
                      </ListItemIcon>
                      <ListItemText primary={l.name} secondary={`${l.geometryType} • ${l.featureCount} features`} sx={{ color: 'white', '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.6)' } }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={!!l.visible}
                          onChange={(e) => {
                            setServerLayers(prev => prev.map(x => x._id === l._id ? { ...x, visible: e.target.checked } : x));
                          }}
                          size="small"
                        />
                        {l.type === 'raster' ? (
                          <IconButton 
                            size="small" 
                            onClick={() => openRasterStylePanel(l)}
                            sx={{ color: 'white' }}
                          >
                            <SettingsIcon />
                          </IconButton>
                        ) : (
                          <IconButton 
                            size="small" 
                            onClick={() => setSelectedLayerForStyling(l)}
                            sx={{ color: 'white' }}
                          >
                            <SettingsIcon />
                          </IconButton>
                        )}
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
                  {serverLayers.filter(l => l.type === 'raster').map((l, idx) => (
                    <ListItem key={l._id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Box sx={{ width: 16, height: 16, bgcolor: '#7b1fa2', borderRadius: '50%' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={l.name}
                        secondary={`${l.rasterMetadata?.bands?.length || 'Unknown'} bands • ${l.rasterMetadata?.width || 'Unknown'}x${l.rasterMetadata?.height || 'Unknown'}`}
                        sx={{ 
                          color: 'white',
                          '& .MuiListItemText-secondary': { color: 'rgba(255,255,255,0.6)' }
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={!!l.visible}
                          onChange={(e) => {
                            setServerLayers(prev => prev.map(x => x._id === l._id ? { ...x, visible: e.target.checked } : x));
                          }}
                          size="small"
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => openRasterStylePanel(l)}
                          sx={{ color: 'white' }}
                          title="Style Settings"
                        >
                          <SettingsIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => openTerrainAnalysisPanel(l)}
                          sx={{ color: 'white' }}
                          title="Terrain Analysis"
                        >
                          <AnalyticsIcon />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                  {serverLayers.filter(l => l.type === 'raster').length === 0 && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText 
                        primary="No raster layers uploaded"
                        sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}
                      />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {/* Analysis Panel */}
        {showAnalysisPanel && (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <GeometryOperations 
              selectedLayers={serverLayers}
              onResultsUpdate={(result) => {
                // Handle analysis results
                console.log('Analysis result:', result);
                
                // Store the analysis result
                setAnalysisResults(prev => [result, ...prev]);
                
                // Add analysis results to highlighted features for map display
                if (result && result.features && result.features.length > 0) {
                  setHighlightedFeatures(prev => [...prev, ...result.features]);
                }
              }}
              onResultVisibilityChange={(resultId, visible) => {
                console.log('Result visibility changed:', resultId, visible);
                // Update highlighted features based on visibility
                setHighlightedFeatures(prev => {
                  if (visible) {
                    // Show features for this result ID - find the result and add its features
                    const result = analysisResults.find(r => r.id === resultId);
                    if (result && result.features) {
                      // Remove any existing features for this result ID first
                      const filteredPrev = prev.filter(feature => feature.resultId !== resultId);
                      return [...filteredPrev, ...result.features];
                    }
                    return prev;
                  } else {
                    // Hide features for this result ID
                    return prev.filter(feature => feature.resultId !== resultId);
                  }
                });
              }}
              onResultDelete={(resultId) => {
                console.log('Result deleted:', resultId);
                // Remove from analysis results
                setAnalysisResults(prev => prev.filter(r => r.id !== resultId));
                // Remove features for this result ID from map
                setHighlightedFeatures(prev => prev.filter(feature => feature.resultId !== resultId));
              }}
            />
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

      {/* Layer Styling Dialog */}
      {selectedLayerForStyling && (
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2000,
            p: 3,
            minWidth: 300,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
            color: 'white'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Style Layer: {selectedLayerForStyling.name}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" gutterBottom>Color</Typography>
              <input
                type="color"
                value={selectedLayerForStyling?.style?.simple?.color || '#00bcd4'}
                onChange={(e) => {
                  setServerLayers(prev => prev.map(l => 
                    l._id === selectedLayerForStyling._id 
                      ? { ...l, style: { ...l.style, simple: { ...l.style?.simple, color: e.target.value } } }
                      : l
                  ));
                  setSelectedLayerForStyling(prev => ({ 
                    ...prev, 
                    style: { ...prev.style, simple: { ...prev.style?.simple, color: e.target.value } } 
                  }));
                }}
                style={{ width: '100%', height: 40, border: 'none', borderRadius: 4 }}
              />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>Weight: {selectedLayerForStyling?.style?.simple?.weight || 2}</Typography>
              <Slider
                value={selectedLayerForStyling?.style?.simple?.weight || 2}
                onChange={(e, value) => {
                  setServerLayers(prev => prev.map(l => 
                    l._id === selectedLayerForStyling._id 
                      ? { ...l, style: { ...l.style, simple: { ...l.style?.simple, weight: value } } }
                      : l
                  ));
                  setSelectedLayerForStyling(prev => ({ 
                    ...prev, 
                    style: { ...prev.style, simple: { ...prev.style?.simple, weight: value } } 
                  }));
                }}
                min={1}
                max={10}
                sx={{ color: '#00bcd4' }}
              />
            </Box>
            <Box>
              <Typography variant="body2" gutterBottom>Fill Opacity: {Math.round((selectedLayerForStyling?.style?.simple?.fillOpacity || 0.3) * 100)}%</Typography>
              <Slider
                value={(selectedLayerForStyling?.style?.simple?.fillOpacity || 0.3) * 100}
                onChange={(e, value) => {
                  const opacity = value / 100;
                  setServerLayers(prev => prev.map(l => 
                    l._id === selectedLayerForStyling._id 
                      ? { ...l, style: { ...l.style, simple: { ...l.style?.simple, fillOpacity: opacity } } }
                      : l
                  ));
                  setSelectedLayerForStyling(prev => ({ 
                    ...prev, 
                    style: { ...prev.style, simple: { ...prev.style?.simple, fillOpacity: opacity } } 
                  }));
                }}
                min={0}
                max={100}
                sx={{ color: '#00bcd4' }}
              />
            </Box>
            <Button
              variant="contained"
              onClick={() => setSelectedLayerForStyling(null)}
              sx={{ bgcolor: '#00bcd4' }}
            >
              Close
            </Button>
          </Box>
        </Paper>
      )}

      {/* Feature Edit Dialog */}
      {selectedFeature && (
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2000,
            p: 3,
            minWidth: 400,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
            color: 'white'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Edit Feature - {selectedFeature.layerName}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Feature Name"
              value={selectedFeature.properties?.name || ''}
              onChange={(e) => setSelectedFeature(prev => ({
                ...prev,
                properties: { ...prev.properties, name: e.target.value }
              }))}
              fullWidth
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'white' }
              }}
            />
            <TextField
              label="Description"
              value={selectedFeature.properties?.description || ''}
              onChange={(e) => setSelectedFeature(prev => ({
                ...prev,
                properties: { ...prev.properties, description: e.target.value }
              }))}
              fullWidth
              multiline
              rows={2}
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': { color: 'white' },
                '& .MuiInputLabel-root': { color: 'white' }
              }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    if (selectedFeature._id) {
                      await updateFeature(selectedFeature.layerId, selectedFeature._id, selectedFeature);
                    } else {
                      await createFeature(selectedFeature.layerId, selectedFeature);
                    }
                    setSelectedFeature(null);
                    // Refresh layer data - preserve visibility state
                    const resp = await listLayers();
                    const layers = resp?.data?.layers || resp?.data || [];
                    setServerLayers(prevLayers => {
                      const prevMap = new Map(prevLayers.map(l => [l._id, l]));
                      return layers.map(l => ({
                        ...l,
                        visible: prevMap.has(l._id) 
                          ? prevMap.get(l._id).visible  // Preserve existing visibility
                          : (l.type === 'raster' ? true : false)  // Default: raster visible, vector hidden
                      }));
                    });
                  } catch (e) {
                    console.error('Failed to save feature:', e);
                  }
                }}
                sx={{ bgcolor: '#00bcd4' }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSelectedFeature(null)}
                sx={{ borderColor: '#00bcd4', color: '#00bcd4' }}
              >
                Cancel
              </Button>
              {selectedFeature._id && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={async () => {
                    try {
                      await deleteFeature(selectedFeature.layerId, selectedFeature._id);
                      setSelectedFeature(null);
                    // Refresh layer data - preserve visibility state
                    const resp = await listLayers();
                    const layers = resp?.data?.layers || resp?.data || [];
                    setServerLayers(prevLayers => {
                      const prevMap = new Map(prevLayers.map(l => [l._id, l]));
                      return layers.map(l => ({
                        ...l,
                        visible: prevMap.has(l._id) 
                          ? prevMap.get(l._id).visible  // Preserve existing visibility
                          : (l.type === 'raster' ? true : false)  // Default: raster visible, vector hidden
                      }));
                    });
                    } catch (e) {
                      console.error('Failed to delete feature:', e);
                    }
                  }}
                >
                  Delete
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Raster Style Panel */}
      {rasterStylePanel.open && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 2000
          }}
        >
          <RasterStylePanel
            layer={rasterStylePanel.layer}
            onStyleUpdate={handleRasterStyleUpdate}
            onClose={closeRasterStylePanel}
          />
        </Box>
      )}

      {/* Terrain Analysis Panel */}
      {terrainAnalysisPanel.open && (
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 2000
          }}
        >
          <TerrainAnalysisPanel
            dataset={terrainAnalysisPanel.dataset}
            onClose={closeTerrainAnalysisPanel}
            onAnalysisComplete={handleTerrainAnalysisComplete}
          />
        </Box>
      )}

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

      {/* Query Panel */}
      <QueryPanel
        onResultsUpdate={(results) => {
          console.log('Query results updated:', results);
          setQueryResults(results);
        }}
        onHighlightFeatures={(features) => {
          console.log('Highlighting features:', features);
          setHighlightedFeatures(features);
        }}
        onClearHighlight={() => {
          console.log('Clearing highlight');
          setHighlightedFeatures([]);
        }}
      />
    </Box>
  );
};

export default MapView;

