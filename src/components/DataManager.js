import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  FileCopy as FileCopyIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  Map as MapIcon,
  DataObject as DataObjectIcon,
  Satellite as SatelliteIcon,
  Terrain as TerrainIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const DataManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const fileInputRef = useRef(null);

  const [datasets, setDatasets] = useState([
    {
      id: 1,
      name: 'Urban Infrastructure',
      type: 'Shapefile',
      size: '15.2 MB',
      format: 'SHP',
      status: 'processed',
      uploadDate: '2024-01-15',
      lastModified: '2024-01-15',
      description: 'Urban infrastructure data including roads, buildings, and utilities',
      layers: 8,
      features: 12500,
      projection: 'WGS84',
      bounds: '37.7749, -122.4194, 37.7849, -122.4094',
      tags: ['infrastructure', 'urban', 'planning']
    },
    {
      id: 2,
      name: 'Population Density',
      type: 'GeoTIFF',
      size: '8.7 MB',
      format: 'TIF',
      status: 'processing',
      uploadDate: '2024-01-14',
      lastModified: '2024-01-14',
      description: 'Population density raster data from census',
      layers: 1,
      features: 0,
      projection: 'WGS84',
      bounds: '37.7749, -122.4194, 37.7849, -122.4094',
      tags: ['population', 'census', 'raster']
    },
    {
      id: 3,
      name: 'Environmental Zones',
      type: 'GeoJSON',
      size: '3.1 MB',
      format: 'JSON',
      status: 'processed',
      uploadDate: '2024-01-13',
      lastModified: '2024-01-13',
      description: 'Environmental protection zones and sensitive areas',
      layers: 3,
      features: 450,
      projection: 'WGS84',
      bounds: '37.7749, -122.4194, 37.7849, -122.4094',
      tags: ['environment', 'zones', 'protection']
    },
    {
      id: 4,
      name: 'Transportation Network',
      type: 'KML',
      size: '2.8 MB',
      format: 'KML',
      status: 'error',
      uploadDate: '2024-01-12',
      lastModified: '2024-01-12',
      description: 'Public transportation routes and stops',
      layers: 2,
      features: 0,
      projection: 'WGS84',
      bounds: '37.7749, -122.4194, 37.7849, -122.4094',
      tags: ['transportation', 'public', 'routes']
    },
    {
      id: 5,
      name: 'Satellite Imagery',
      type: 'GeoTIFF',
      size: '45.3 MB',
      format: 'TIF',
      status: 'processed',
      uploadDate: '2024-01-11',
      lastModified: '2024-01-11',
      description: 'High-resolution satellite imagery from Landsat 8',
      layers: 4,
      features: 0,
      projection: 'UTM Zone 10N',
      bounds: '37.7749, -122.4194, 37.7849, -122.4094',
      tags: ['satellite', 'imagery', 'landsat']
    }
  ]);

  const [supportedFormats] = useState([
    { name: 'Shapefile', extensions: ['.shp', '.shx', '.dbf', '.prj'], icon: <MapIcon />, color: '#1976d2' },
    { name: 'GeoJSON', extensions: ['.geojson', '.json'], icon: <DataObjectIcon />, color: '#388e3c' },
    { name: 'KML', extensions: ['.kml', '.kmz'], icon: <MapIcon />, color: '#f57c00' },
    { name: 'GeoTIFF', extensions: ['.tif', '.tiff', '.gtif'], icon: <SatelliteIcon />, color: '#7b1fa2' },
    { name: 'CSV', extensions: ['.csv'], icon: <DataObjectIcon />, color: '#5d4037' },
    { name: 'GPX', extensions: ['.gpx'], icon: <TerrainIcon />, color: '#455a64' }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'success';
      case 'processing': return 'warning';
      case 'error': return 'error';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed': return <CheckCircleIcon />;
      case 'processing': return <RefreshIcon />;
      case 'error': return <ErrorIcon />;
      case 'pending': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const getFormatIcon = (format) => {
    const formatInfo = supportedFormats.find(f => f.name === format);
    return formatInfo ? formatInfo.icon : <DataObjectIcon />;
  };

  const getFormatColor = (format) => {
    const formatInfo = supportedFormats.find(f => f.name === format);
    return formatInfo ? formatInfo.color : '#666';
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setSnackbar({ open: true, message: 'Files uploaded successfully', severity: 'success' });
          
          // Add new datasets
          const newDatasets = files.map((file, index) => ({
            id: Date.now() + index,
            name: file.name.split('.')[0],
            type: getFileType(file.name),
            size: formatFileSize(file.size),
            format: file.name.split('.').pop().toUpperCase(),
            status: 'processed',
            uploadDate: new Date().toISOString().split('T')[0],
            lastModified: new Date().toISOString().split('T')[0],
            description: `Uploaded file: ${file.name}`,
            layers: 1,
            features: Math.floor(Math.random() * 1000),
            projection: 'WGS84',
            bounds: '37.7749, -122.4194, 37.7849, -122.4094',
            tags: ['uploaded', 'new']
          }));
          
          setDatasets(prev => [...newDatasets, ...prev]);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const format = supportedFormats.find(f => f.extensions.includes(`.${ext}`));
    return format ? format.name : 'Unknown';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (dataset) => {
    setSnackbar({ open: true, message: `Downloading ${dataset.name}...`, severity: 'info' });
    // Simulate download
    setTimeout(() => {
      setSnackbar({ open: true, message: `${dataset.name} downloaded successfully`, severity: 'success' });
    }, 2000);
  };

  const handleDelete = (datasetId) => {
    setDatasets(prev => prev.filter(dataset => dataset.id !== datasetId));
    setSnackbar({ open: true, message: 'Dataset deleted successfully', severity: 'success' });
  };

  const handleReprocess = (datasetId) => {
    setDatasets(prev => prev.map(dataset => 
      dataset.id === datasetId ? { ...dataset, status: 'processing' } : dataset
    ));
    setSnackbar({ open: true, message: 'Reprocessing dataset...', severity: 'info' });
    
    // Simulate reprocessing
    setTimeout(() => {
      setDatasets(prev => prev.map(dataset => 
        dataset.id === datasetId ? { ...dataset, status: 'processed' } : dataset
      ));
      setSnackbar({ open: true, message: 'Dataset reprocessed successfully', severity: 'success' });
    }, 3000);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Data Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ bgcolor: '#00bcd4' }}
          >
            Upload Data
          </Button>
          <Button
            variant="outlined"
            startIcon={<CloudDownloadIcon />}
            sx={{ borderColor: '#00bcd4', color: '#00bcd4' }}
          >
            Bulk Download
          </Button>
        </Box>
      </Box>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".shp,.shx,.dbf,.prj,.geojson,.json,.kml,.kmz,.tif,.tiff,.gtif,.csv,.gpx"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Upload Progress */}
      {isUploading && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploading Files...
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {uploadProgress}% complete
          </Typography>
        </Paper>
      )}

      {/* Supported Formats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Supported File Formats
        </Typography>
        <Grid container spacing={2}>
          {supportedFormats.map((format) => (
            <Grid item xs={12} sm={6} md={4} key={format.name}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ color: format.color, mr: 1 }}>
                      {format.icon}
                    </Box>
                    <Typography variant="h6">{format.name}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Extensions: {format.extensions.join(', ')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Dataset List */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Datasets ({datasets.length})
        </Typography>
        
        <List>
          {datasets.map((dataset) => (
            <Paper key={dataset.id} sx={{ mb: 1, p: 1 }}>
              <ListItem>
                <ListItemIcon>
                  <Box sx={{ color: getFormatColor(dataset.type) }}>
                    {getFormatIcon(dataset.type)}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6">{dataset.name}</Typography>
                      <Chip
                        icon={getStatusIcon(dataset.status)}
                        label={dataset.status}
                        color={getStatusColor(dataset.status)}
                        size="small"
                      />
                      <Chip
                        label={dataset.type}
                        size="small"
                        variant="outlined"
                        sx={{ color: getFormatColor(dataset.type) }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {dataset.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Typography variant="caption">
                          Size: {dataset.size}
                        </Typography>
                        <Typography variant="caption">
                          Uploaded: {dataset.uploadDate}
                        </Typography>
                        <Typography variant="caption">
                          Features: {dataset.features.toLocaleString()}
                        </Typography>
                        <Typography variant="caption">
                          Layers: {dataset.layers}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        {dataset.tags.map((tag, index) => (
                          <Chip key={index} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton>
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton onClick={() => handleDownload(dataset)}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reprocess">
                      <IconButton onClick={() => handleReprocess(dataset.id)}>
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(dataset.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            </Paper>
          ))}
        </List>
      </Paper>

      {/* Data Statistics */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FolderIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Datasets
                  </Typography>
                  <Typography variant="h5">
                    {datasets.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Processed
                  </Typography>
                  <Typography variant="h5">
                    {datasets.filter(d => d.status === 'processed').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DataObjectIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Features
                  </Typography>
                  <Typography variant="h5">
                    {datasets.reduce((sum, d) => sum + d.features, 0).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MapIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Layers
                  </Typography>
                  <Typography variant="h5">
                    {datasets.reduce((sum, d) => sum + d.layers, 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default DataManager;

