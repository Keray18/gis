import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Crop as CropIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Transform as TransformIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon,
  Map as MapIcon
} from '@mui/icons-material';
import {
  listClippings,
  deleteClipping,
  convertClippingToDataset,
  getClippingFeatures
} from '../services/api';
import { listDatasets } from '../services/api';

const ClippingsManager = ({ onClippingSelect, onClippingLoad }) => {
  const [clippings, setClippings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterBoundary, setFilterBoundary] = useState('');
  const [datasets, setDatasets] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clippingToDelete, setClippingToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedClipping, setSelectedClipping] = useState(null);

  useEffect(() => {
    loadClippings();
    loadDatasets();
  }, []);

  const loadClippings = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (filterSource) params.sourceDatasetId = filterSource;
      if (filterBoundary) params.boundaryDatasetId = filterBoundary;

      const response = await listClippings(params);
      if (response.success) {
        setClippings(response.data || []);
      }
    } catch (error) {
      console.error('Error loading clippings:', error);
      showSnackbar('Failed to load clippings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDatasets = async () => {
    try {
      const response = await listDatasets();
      if (response.success) {
        setDatasets(response.data?.datasets || response.data || []);
      }
    } catch (error) {
      console.error('Error loading datasets:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDelete = async () => {
    if (!clippingToDelete) return;

    setDeleting(true);
    try {
      const response = await deleteClipping(clippingToDelete._id);
      if (response.success) {
        showSnackbar('Clipping deleted successfully', 'success');
        loadClippings();
        setDeleteDialogOpen(false);
        setClippingToDelete(null);
      } else {
        showSnackbar('Failed to delete clipping', 'error');
      }
    } catch (error) {
      console.error('Error deleting clipping:', error);
      showSnackbar(`Failed to delete clipping: ${error.message}`, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleConvertToDataset = async (clipping) => {
    try {
      const response = await convertClippingToDataset(clipping._id);
      if (response.success) {
        showSnackbar('Clipping converted to dataset successfully', 'success');
        loadDatasets(); // Refresh datasets list
      } else {
        showSnackbar('Failed to convert clipping', 'error');
      }
    } catch (error) {
      console.error('Error converting clipping:', error);
      showSnackbar(`Failed to convert clipping: ${error.message}`, 'error');
    }
  };

  const handleLoadClipping = async (clipping) => {
    try {
      const response = await getClippingFeatures(clipping._id);
      if (response.success) {
        const clippingWithFeatures = {
          ...clipping,
          features: response.data.features,
          type: 'clipping',
          loadedAt: new Date().toISOString()
        };
        
        // Store in localStorage so MapView can access it
        const loadedClippings = JSON.parse(localStorage.getItem('loadedClippings') || '[]');
        // Remove any existing clipping with same ID
        const filtered = loadedClippings.filter(c => c._id !== clipping._id);
        filtered.push(clippingWithFeatures);
        localStorage.setItem('loadedClippings', JSON.stringify(filtered));
        
        // Dispatch custom event to notify MapView
        window.dispatchEvent(new CustomEvent('clippingLoaded'));
        
        // Call callback if provided
        if (onClippingLoad) {
          onClippingLoad(clippingWithFeatures);
        }
        
        showSnackbar(`Clipping "${clipping.name}" loaded on map (${response.data.features.length} features)`, 'success');
      } else {
        showSnackbar('Failed to load clipping: Invalid response', 'error');
      }
    } catch (error) {
      console.error('Error loading clipping:', error);
      showSnackbar(`Failed to load clipping: ${error.message}`, 'error');
    }
  };

  const handleMenuOpen = (event, clipping) => {
    setMenuAnchor(event.currentTarget);
    setSelectedClipping(clipping);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedClipping(null);
  };

  const getDatasetName = (datasetId) => {
    const dataset = datasets.find(d => d._id === datasetId);
    return dataset ? dataset.name : 'Unknown';
  };

  const filteredClippings = clippings.filter(clipping => {
    if (searchQuery && !clipping.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !clipping.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
          Clippings Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadClippings}
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.05)' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search clippings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filter by Source"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              SelectProps={{
                native: true,
                sx: { color: 'white' }
              }}
              sx={{
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
                }
              }}
            >
              <option value="">All Sources</option>
              {datasets.map(dataset => (
                <option key={dataset._id} value={dataset._id}>
                  {dataset.name}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filter by Boundary"
              value={filterBoundary}
              onChange={(e) => setFilterBoundary(e.target.value)}
              SelectProps={{
                native: true,
                sx: { color: 'white' }
              }}
              sx={{
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
                }
              }}
            >
              <option value="">All Boundaries</option>
              {datasets.map(dataset => (
                <option key={dataset._id} value={dataset._id}>
                  {dataset.name}
                </option>
              ))}
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {(filterSource || filterBoundary || searchQuery) && (
            <Button
              size="small"
              onClick={() => {
                setFilterSource('');
                setFilterBoundary('');
                setSearchQuery('');
              }}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Clear Filters
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            onClick={loadClippings}
            sx={{ bgcolor: '#00bcd4' }}
          >
            Apply Filters
          </Button>
        </Box>
      </Paper>

      {/* Clippings List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredClippings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.05)' }}>
          <CropIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            No clippings found
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {searchQuery || filterSource || filterBoundary
              ? 'Try adjusting your search or filters'
              : 'Create clippings using the Geometry Operations panel'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredClippings.map((clipping) => (
            <Grid item xs={12} md={6} lg={4} key={clipping._id}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CropIcon sx={{ color: '#00bcd4' }} />
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        {clipping.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, clipping)}
                      sx={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  {clipping.description && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                      {clipping.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      label={`${clipping.featureCount} features`}
                      size="small"
                      sx={{ bgcolor: '#00bcd4', color: 'white' }}
                    />
                    <Chip
                      icon={<MapIcon />}
                      label={getDatasetName(clipping.sourceDatasetId?._id || clipping.sourceDatasetId)}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      <strong>Boundary:</strong> {getDatasetName(clipping.boundaryDatasetId?._id || clipping.boundaryDatasetId)}
                    </Typography>
                    <br />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Created: {new Date(clipping.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleLoadClipping(clipping)}
                    sx={{ color: '#00bcd4' }}
                  >
                    Load on Map
                  </Button>
                  <Button
                    size="small"
                    startIcon={<TransformIcon />}
                    onClick={() => handleConvertToDataset(clipping)}
                    sx={{ color: '#4caf50' }}
                  >
                    Convert
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#2d2d2d',
            color: 'white'
          }
        }}
      >
        <MenuItem onClick={() => {
          if (selectedClipping) {
            handleLoadClipping(selectedClipping);
            handleMenuClose();
          }
        }}>
          <VisibilityIcon sx={{ mr: 1 }} /> Load on Map
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedClipping) {
            handleConvertToDataset(selectedClipping);
            handleMenuClose();
          }
        }}>
          <TransformIcon sx={{ mr: 1 }} /> Convert to Dataset
        </MenuItem>
        <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        <MenuItem onClick={() => {
          if (selectedClipping) {
            setClippingToDelete(selectedClipping);
            setDeleteDialogOpen(true);
            handleMenuClose();
          }
        }} sx={{ color: '#ff5722' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e1e1e',
            color: 'white'
          }
        }}
      >
        <DialogTitle>Delete Clipping</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Are you sure you want to delete "{clippingToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleting}
            variant="contained"
            sx={{ bgcolor: '#ff5722' }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default ClippingsManager;

