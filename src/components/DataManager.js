import React, { useState, useRef, useEffect } from 'react';
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
  Badge,
  CircularProgress,
  Skeleton
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
  TableChart as TableChartIcon,
  Satellite as SatelliteIcon,
  Terrain as TerrainIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { uploadDataset, listDatasets, getLayerFeatures } from '../services/api';
import ClippingsManager from './ClippingsManager';

const DataManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const fileInputRef = useRef(null);

  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState(new Set());

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

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const resp = await listDatasets();
        console.log('Datasets API response:', resp);
        const datasetsArray = resp?.data?.datasets || resp?.data || [];
        console.log('Datasets array:', datasetsArray);
        console.log('First dataset structure:', datasetsArray[0]);
        setDatasets(datasetsArray);
      } catch (error) {
        console.error('Error fetching datasets:', error);
        setDatasets([]);
        setSnackbar({
          open: true,
          message: 'Failed to fetch datasets',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Check for duplicates
    const duplicates = [];
    const newFiles = [];
    
    files.forEach(file => {
      const isDuplicate = datasets.some(dataset => 
        (dataset.originalFileName || dataset.name) === file.name
      );
      if (isDuplicate) {
        duplicates.push(file.name);
      } else {
        newFiles.push(file);
      }
    });

    if (duplicates.length > 0) {
      setSnackbar({ 
        open: true, 
        message: `Skipped ${duplicates.length} duplicate files: ${duplicates.join(', ')}`, 
        severity: 'warning' 
      });
    }

    if (newFiles.length === 0) {
      setSnackbar({ 
        open: true, 
        message: 'All files are duplicates. Use "Cleanup Duplicates" to remove old versions first.', 
        severity: 'info' 
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    let successCount = 0;
    let errorCount = 0;

    for (const file of newFiles) {
      try {
        await uploadDataset(file);
        successCount++;
        setUploadProgress((p) => Math.min(100, p + Math.ceil(100 / newFiles.length)));
      } catch (e) {
        errorCount++;
        console.error('Upload error for file:', file.name, e);
        setSnackbar({ open: true, message: `Upload failed for ${file.name}: ${e?.message || 'Unknown error'}`, severity: 'error' });
      }
    }
    
    // Only refresh datasets and show success if at least one file uploaded successfully
    if (successCount > 0) {
      try {
        const resp = await listDatasets();
        setDatasets(resp?.data?.datasets || resp?.data || []);
      } catch (error) {
        console.error('Error refreshing datasets after upload:', error);
      }
    }
    
    // Show appropriate message based on results
    if (successCount > 0 && errorCount === 0) {
      setSnackbar({ open: true, message: `${successCount} file(s) uploaded successfully`, severity: 'success' });
    } else if (successCount > 0 && errorCount > 0) {
      setSnackbar({ open: true, message: `${successCount} file(s) uploaded, ${errorCount} failed`, severity: 'warning' });
    } else if (errorCount > 0) {
      setSnackbar({ open: true, message: `All ${errorCount} file(s) failed to upload`, severity: 'error' });
    }
    
    setIsUploading(false);
  };

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const format = supportedFormats.find(f => f.extensions.includes(`.${ext}`));
    return format ? format.name : 'Unknown';
  };

  const handleExport = async (dataset, format) => {
    try {
      if (format === 'geojson') {
        // Get all features for the dataset's layers
        const allFeatures = [];
        for (const layer of dataset.layers || []) {
          try {
            const featuresResp = await getLayerFeatures(layer._id);
            const features = featuresResp?.data?.features || featuresResp?.data?.data?.features || [];
            allFeatures.push(...features);
          } catch (e) {
            console.error(`Failed to get features for layer ${layer._id}:`, e);
          }
        }
        
        const geojson = {
          type: 'FeatureCollection',
          features: allFeatures
        };
        
        const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataset.name}.geojson`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Convert to CSV
        const allFeatures = [];
        for (const layer of dataset.layers || []) {
          try {
            const featuresResp = await getLayerFeatures(layer._id);
            const features = featuresResp?.data?.features || featuresResp?.data?.data?.features || [];
            allFeatures.push(...features);
          } catch (e) {
            console.error(`Failed to get features for layer ${layer._id}:`, e);
          }
        }
        
        if (allFeatures.length === 0) return;
        
        // Get all unique property keys
        const allKeys = new Set();
        allFeatures.forEach(f => {
          if (f.properties) {
            Object.keys(f.properties).forEach(k => allKeys.add(k));
          }
        });
        
        const headers = ['id', 'type', 'coordinates', ...Array.from(allKeys)];
        const csvRows = [headers.join(',')];
        
        allFeatures.forEach(f => {
          const row = [
            f._id || '',
            f.geometry?.type || '',
            JSON.stringify(f.geometry?.coordinates || []),
            ...Array.from(allKeys).map(k => `"${(f.properties?.[k] || '').toString().replace(/"/g, '""')}"`)
          ];
          csvRows.push(row.join(','));
        });
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataset.name}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
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

  const handleDelete = async (datasetId) => {
    console.log('Attempting to delete dataset with ID:', datasetId);
    try {
      setDeletingIds(prev => new Set(prev).add(datasetId));
      // Make API call to delete from backend
      const response = await fetch(`http://localhost:5000/api/datasets/${datasetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete dataset');
      }

      // Remove from local state only after successful backend deletion
      setDatasets(prev => prev.filter(dataset => (dataset._id || dataset.id) !== datasetId));
      setSnackbar({ open: true, message: 'Dataset deleted successfully', severity: 'success' });
    } catch (error) {
      console.error('Error deleting dataset:', error);
      setSnackbar({ open: true, message: 'Failed to delete dataset', severity: 'error' });
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(datasetId);
        return next;
      });
    }
  };

  const handleReprocess = (datasetId) => {
    setDatasets(prev => prev.map(dataset => 
      (dataset._id || dataset.id) === datasetId ? { ...dataset, status: 'processing' } : dataset
    ));
    setSnackbar({ open: true, message: 'Reprocessing dataset...', severity: 'info' });
    
    // Simulate reprocessing
    setTimeout(() => {
      setDatasets(prev => prev.map(dataset => 
        (dataset._id || dataset.id) === datasetId ? { ...dataset, status: 'processed' } : dataset
      ));
      setSnackbar({ open: true, message: 'Dataset reprocessed successfully', severity: 'success' });
    }, 3000);
  };

  const handleCleanupDuplicates = async () => {
    try {
      // Group datasets by filename
      const grouped = datasets.reduce((acc, dataset) => {
        const key = dataset.originalFileName || dataset.name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(dataset);
        return acc;
      }, {});

      // Find duplicates (keep the most recent one)
      const duplicates = [];
      Object.values(grouped).forEach(group => {
        if (group.length > 1) {
          // Sort by upload date, keep the most recent
          const sorted = group.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
          duplicates.push(...sorted.slice(1)); // All except the first (most recent)
        }
      });

      // Delete duplicates
      for (const duplicate of duplicates) {
        await handleDelete(duplicate._id || duplicate.id);
      }

      setSnackbar({ 
        open: true, 
        message: `Cleaned up ${duplicates.length} duplicate datasets`, 
        severity: 'success' 
      });
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      setSnackbar({ open: true, message: 'Failed to cleanup duplicates', severity: 'error' });
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const resp = await listDatasets();
      const datasetsArray = resp?.data?.datasets || resp?.data || [];
      setDatasets(datasetsArray);
      setSnackbar({ open: true, message: 'Data refreshed successfully', severity: 'success' });
    } catch (error) {
      console.error('Error refreshing datasets:', error);
      setSnackbar({ open: true, message: 'Failed to refresh data', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Loading Spinner */}
      {isLoading && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          gap: 2
        }}>
          <CircularProgress size={60} sx={{ color: '#00bcd4' }} />
          <Typography variant="h6" color="textSecondary">
            Loading datasets...
          </Typography>
        </Box>
      )}

      {/* Main Content - Only show when not loading */}
      {!isLoading && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">
              Data Manager
            </Typography>
          </Box>

          {/* Tabs */}
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Datasets" />
            <Tab label="Clippings" />
          </Tabs>

          {/* Tab Content */}
          {tabValue === 0 && (
            <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ bgcolor: '#00bcd4' }}
                disabled={isLoading}
              >
                Upload Data
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                sx={{ borderColor: '#00bcd4', color: '#00bcd4' }}
                disabled={isLoading}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<CloudDownloadIcon />}
                sx={{ borderColor: '#00bcd4', color: '#00bcd4' }}
                disabled={isLoading}
              >
                Bulk Download
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleCleanupDuplicates}
                sx={{ borderColor: '#ff5722', color: '#ff5722' }}
                disabled={isLoading}
              >
                Cleanup Duplicates
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
            <Paper key={dataset._id || dataset.id} sx={{ mb: 1, p: 1 }}>
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
                          Size: {dataset.filesize ? formatFileSize(dataset.filesize) : '—'}
                        </Typography>
                        <Typography variant="caption">
                          Uploaded: {dataset.createdAt ? new Date(dataset.createdAt).toLocaleDateString() : '—'}
                        </Typography>
                        <Typography variant="caption">
                          Features: {Number(dataset.featureCount || dataset.features || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption">
                          Layers: {dataset.layers || (dataset.layer ? 1 : 1)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        {(dataset.tags || []).map((tag, index) => (
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
                    <Tooltip title="Export GeoJSON">
                      <IconButton onClick={() => handleExport(dataset, 'geojson')}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export CSV">
                      <IconButton onClick={() => handleExport(dataset, 'csv')}>
                        <TableChartIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reprocess">
                      <IconButton onClick={() => handleReprocess(dataset._id || dataset.id)}>
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={deletingIds.has(dataset._id || dataset.id) ? "Deleting..." : "Delete"}>
                      <span>
                        <IconButton 
                          onClick={() => handleDelete(dataset._id || dataset.id)} 
                          color="error"
                          disabled={deletingIds.has(dataset._id || dataset.id)}
                        >
                          {deletingIds.has(dataset._id || dataset.id) ? (
                            <CircularProgress size={20} />
                          ) : (
                            <DeleteIcon />
                          )}
                        </IconButton>
                      </span>
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
                    {datasets.reduce((sum, d) => sum + (d.featureCount || 0), 0).toLocaleString()}
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
                    {datasets.filter(d => d.status === 'ready').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Feature Details Section */}
      {datasets.length > 0 && (
        <Paper sx={{ mt: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dataset Features Overview
          </Typography>
          <Grid container spacing={2}>
            {datasets.map((dataset) => (
              <Grid item xs={12} md={6} key={dataset._id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {getFormatIcon(dataset.type)}
                      <Typography variant="h6" sx={{ ml: 1 }}>
                        {dataset.name}
                      </Typography>
                      <Chip 
                        label={dataset.status} 
                        color={getStatusColor(dataset.status)}
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Type: {dataset.type} • Features: {dataset.featureCount || 0}
                      {dataset.totalFeatures && dataset.totalFeatures > (dataset.featureCount || 0) && 
                        ` (${dataset.totalFeatures} total)`
                      }
                    </Typography>
                    
                    {dataset.features && dataset.features.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Sample Features:
                        </Typography>
                        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                          {dataset.features.slice(0, 5).map((feature, index) => (
                            <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="caption" display="block">
                                <strong>Type:</strong> {feature.type}
                              </Typography>
                              <Typography variant="caption" display="block">
                                <strong>Geometry:</strong> {feature.geometry?.type}
                              </Typography>
                              {feature.properties && Object.keys(feature.properties).length > 0 && (
                                <Typography variant="caption" display="block">
                                  <strong>Properties:</strong> {Object.keys(feature.properties).join(', ')}
                                </Typography>
                              )}
                            </Box>
                          ))}
                          {dataset.features.length > 5 && (
                            <Typography variant="caption" color="textSecondary">
                              ... and {dataset.features.length - 5} more features
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    
                    {dataset.isLargeFile && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Large file: Only first {dataset.featureCount || 0} features processed
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
            </>
          )}

          {tabValue === 1 && (
            <ClippingsManager 
              onClippingSelect={(clipping) => {
                // Handle clipping selection if needed
                console.log('Clipping selected:', clipping);
              }}
              onClippingLoad={(clipping) => {
                // Handle loading clipping on map
                console.log('Load clipping on map:', clipping);
                setSnackbar({
                  open: true,
                  message: 'Clipping loaded. Switch to Map View to see it.',
                  severity: 'info'
                });
              }}
            />
          )}
        </>
      )}

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

