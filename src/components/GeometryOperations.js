import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  RadioButtonUnchecked as BufferIcon,
  Merge as UnionIcon,
  CropFree as IntersectIcon,
  Crop as ClipIcon,
  Layers as DissolveIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  bufferAnalysis,
  unionFeatures,
  intersectFeatures,
  clipFeatures,
  dissolveFeatures,
  listDatasets,
  saveClipping
} from '../services/api';

const GeometryOperations = ({ selectedLayers, onResultsUpdate, onResultVisibilityChange, onResultDelete }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedDataset2, setSelectedDataset2] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [operationParams, setOperationParams] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [savingClipping, setSavingClipping] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [clippingToSave, setClippingToSave] = useState(null);
  const [clippingName, setClippingName] = useState('');
  const [clippingDescription, setClippingDescription] = useState('');

  // Operation configurations
  const operations = {
    buffer: {
      name: 'Buffer Analysis',
      icon: <BufferIcon />,
      description: 'Create buffers around features',
      params: [
        { name: 'distance', label: 'Distance', type: 'number', required: true },
        { name: 'unit', label: 'Unit', type: 'select', options: ['kilometers', 'meters', 'miles', 'feet'], required: true }
      ]
    },
    union: {
      name: 'Union Features',
      icon: <UnionIcon />,
      description: 'Merge overlapping features',
      params: []
    },
    intersect: {
      name: 'Intersect Features',
      icon: <IntersectIcon />,
      description: 'Find intersections between two datasets',
      params: [
        { name: 'dataset2', label: 'Second Dataset', type: 'select', required: true }
      ]
    },
    clip: {
      name: 'Clip Features',
      icon: <ClipIcon />,
      description: 'Clip features to boundary',
      params: [
        { name: 'boundaryDataset', label: 'Boundary Dataset', type: 'select', required: true }
      ]
    },
    dissolve: {
      name: 'Dissolve Features',
      icon: <DissolveIcon />,
      description: 'Dissolve features by attribute',
      params: [
        { name: 'attribute', label: 'Dissolve Attribute', type: 'text', required: true }
      ]
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const response = await listDatasets();
      if (response.success) {
        setDatasets(response.data.datasets || response.data || []);
      }
    } catch (error) {
      console.error('Error loading datasets:', error);
    }
  };

  const handleOperation = async (operationType) => {
    if (!selectedDataset) {
      alert('Please select a dataset');
      return;
    }

    setLoading(true);
    try {
      let result;
      const dataset = datasets.find(d => d._id === selectedDataset);
      const features = selectedFeatures.length > 0 ? selectedFeatures : dataset.features;

      switch (operationType) {
        case 'buffer':
          result = await bufferAnalysis(
            selectedDataset,
            features,
            operationParams.distance,
            operationParams.unit || 'kilometers'
          );
          break;

        case 'union':
          result = await unionFeatures(selectedDataset, features);
          break;

        case 'intersect':
          if (!selectedDataset2) {
            alert('Please select a second dataset for intersection');
            return;
          }
          result = await intersectFeatures(
            selectedDataset,
            selectedDataset2,
            features,
            datasets.find(d => d._id === selectedDataset2)?.features
          );
          break;

        case 'clip':
          if (!operationParams.boundaryDataset) {
            alert('Please select a boundary dataset');
            return;
          }
          result = await clipFeatures(
            selectedDataset,
            operationParams.boundaryDataset,
            features
          );
          break;

        case 'dissolve':
          if (!operationParams.attribute) {
            alert('Please enter dissolve attribute');
            return;
          }
          result = await dissolveFeatures(
            selectedDataset,
            features,
            operationParams.attribute
          );
          break;

        default:
          throw new Error('Unknown operation type');
      }

      if (result.success) {
        // Add result ID to features for tracking
        const featuresWithResultId = result.data.features.map(feature => ({
          ...feature,
          resultId: `result_${Date.now()}`
        }));

        const newResult = {
          id: `result_${Date.now()}`,
          operation: operationType,
          dataset: dataset.name,
          features: featuresWithResultId,
          count: result.data.count,
          parameters: result.data.parameters,
          timestamp: new Date().toISOString(),
          visible: true
        };

        setResults(prev => [newResult, ...prev]);
        setShowResults(true);
        
        // Notify parent component with features that have result ID
        if (onResultsUpdate) {
          onResultsUpdate(newResult);
        }
      }
    } catch (error) {
      console.error('Operation failed:', error);
      alert(`Operation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleResultVisibility = (resultId) => {
    setResults(prev => prev.map(r => {
      if (r.id === resultId) {
        const newVisible = !r.visible;
        // Notify parent component about visibility change
        if (onResultVisibilityChange) {
          onResultVisibilityChange(resultId, newVisible);
        }
        return { ...r, visible: newVisible };
      }
      return r;
    }));
  };

  const deleteResult = (resultId) => {
    setResults(prev => prev.filter(r => r.id !== resultId));
    // Notify parent component about deletion
    if (onResultDelete) {
      onResultDelete(resultId);
    }
  };

  const handleSaveClipping = (result) => {
    if (result.operation !== 'clip') return;
    
    const dataset = datasets.find(d => d._id === selectedDataset);
    const boundaryDataset = datasets.find(d => d._id === operationParams.boundaryDataset);
    
    if (!dataset || !boundaryDataset) {
      alert('Source or boundary dataset not found');
      return;
    }

    setClippingToSave({
      result,
      sourceDatasetId: selectedDataset,
      boundaryDatasetId: operationParams.boundaryDataset,
      sourceDatasetName: dataset.name,
      boundaryDatasetName: boundaryDataset.name
    });
    setClippingName(`${dataset.name} - Clipped by ${boundaryDataset.name}`);
    setSaveDialogOpen(true);
  };

  const handleConfirmSaveClipping = async () => {
    if (!clippingName.trim()) {
      alert('Please enter a name for the clipping');
      return;
    }

    setSavingClipping(true);
    try {
      const clippingData = {
        name: clippingName,
        description: clippingDescription,
        sourceDatasetId: clippingToSave.sourceDatasetId,
        boundaryDatasetId: clippingToSave.boundaryDatasetId,
        features: clippingToSave.result.features,
        clipParameters: clippingToSave.result.parameters
      };

      const response = await saveClipping(clippingData);
      
      if (response.success) {
        alert('Clipping saved successfully!');
        setSaveDialogOpen(false);
        setClippingToSave(null);
        setClippingName('');
        setClippingDescription('');
      } else {
        alert(`Failed to save clipping: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving clipping:', error);
      alert(`Failed to save clipping: ${error.message}`);
    } finally {
      setSavingClipping(false);
    }
  };

  const renderParameterInput = (param, operationType) => {
    switch (param.type) {
      case 'number':
        return (
          <TextField
            key={param.name}
            label={param.label}
            type="number"
            value={operationParams[param.name] || ''}
            onChange={(e) => setOperationParams(prev => ({
              ...prev,
              [param.name]: parseFloat(e.target.value)
            }))}
            fullWidth
            margin="dense"
            required={param.required}
          />
        );

      case 'select':
        if (param.name === 'dataset2') {
          return (
            <FormControl key={param.name} fullWidth margin="dense" required={param.required}>
              <InputLabel>{param.label}</InputLabel>
              <Select
                value={selectedDataset2}
                onChange={(e) => setSelectedDataset2(e.target.value)}
              >
                {datasets.filter(d => d._id !== selectedDataset).map(dataset => (
                  <MenuItem key={dataset._id} value={dataset._id}>
                    {dataset.name} ({dataset.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        } else if (param.name === 'boundaryDataset') {
          return (
            <FormControl key={param.name} fullWidth margin="dense" required={param.required}>
              <InputLabel>{param.label}</InputLabel>
              <Select
                value={operationParams[param.name] || ''}
                onChange={(e) => setOperationParams(prev => ({
                  ...prev,
                  [param.name]: e.target.value
                }))}
              >
                {datasets.map(dataset => (
                  <MenuItem key={dataset._id} value={dataset._id}>
                    {dataset.name} ({dataset.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        } else {
          return (
            <FormControl key={param.name} fullWidth margin="dense" required={param.required}>
              <InputLabel>{param.label}</InputLabel>
              <Select
                value={operationParams[param.name] || ''}
                onChange={(e) => setOperationParams(prev => ({
                  ...prev,
                  [param.name]: e.target.value
                }))}
              >
                {param.options.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }

      case 'text':
        return (
          <TextField
            key={param.name}
            label={param.label}
            value={operationParams[param.name] || ''}
            onChange={(e) => setOperationParams(prev => ({
              ...prev,
              [param.name]: e.target.value
            }))}
            fullWidth
            margin="dense"
            required={param.required}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'white', mb: 3 }}>
        Advanced Geometry Operations
      </Typography>

      {/* Dataset Selection */}
      <FormControl fullWidth margin="dense" sx={{ mb: 3 }}>
        <InputLabel sx={{ color: 'white' }}>Select Dataset</InputLabel>
        <Select
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
          sx={{ color: 'white' }}
        >
          {datasets.map(dataset => (
            <MenuItem key={dataset._id} value={dataset._id}>
              {dataset.name} ({dataset.type}) - {dataset.featureCount || 0} features
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Operations */}
      {Object.entries(operations).map(([operationType, operation]) => (
        <Accordion key={operationType} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {operation.icon}
              <Typography sx={{ color: 'white' }}>
                {operation.name}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              {operation.description}
            </Typography>

            {/* Parameters */}
            {operation.params.map(param => renderParameterInput(param, operationType))}

            {/* Execute Button */}
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <PlayIcon />}
              onClick={() => handleOperation(operationType)}
              disabled={loading || !selectedDataset}
              sx={{ mt: 2, bgcolor: '#00bcd4' }}
            >
              Execute {operation.name}
            </Button>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Results */}
      {results.length > 0 && (
        <Paper sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
            Operation Results ({results.length})
          </Typography>
          
          <List>
            {results.map((result) => (
              <ListItem key={result.id} sx={{ border: '1px solid rgba(255,255,255,0.1)', mb: 1, borderRadius: 1 }}>
                <ListItemIcon>
                  {operations[result.operation]?.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ color: 'white' }}>
                        {operations[result.operation]?.name}
                      </Typography>
                      <Chip 
                        label={`${result.count} features`} 
                        size="small" 
                        color="primary" 
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Dataset: {result.dataset} • {new Date(result.timestamp).toLocaleString()}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {result.operation === 'clip' && (
                      <Tooltip title="Save as Clipping">
                        <IconButton
                          size="small"
                          onClick={() => handleSaveClipping(result)}
                          sx={{ color: '#4caf50' }}
                        >
                          <SaveIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={result.visible ? "Hide" : "Show"}>
                      <IconButton
                        size="small"
                        onClick={() => toggleResultVisibility(result.id)}
                        sx={{ color: result.visible ? '#00bcd4' : 'rgba(255,255,255,0.5)' }}
                      >
                        {result.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Result">
                      <IconButton
                        size="small"
                        onClick={() => deleteResult(result.id)}
                        sx={{ color: '#ff5722' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Info Alert */}
      <Alert severity="info" sx={{ mt: 2, bgcolor: 'rgba(33,150,243,0.1)', color: 'white' }}>
        <Typography variant="body2">
          <strong>Tip:</strong> Select specific features from the map for targeted operations, 
          or leave unselected to process all features in the dataset.
        </Typography>
      </Alert>

      {/* Save Clipping Dialog */}
      <Dialog 
        open={saveDialogOpen} 
        onClose={() => setSaveDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e1e1e',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white' }}>Save as Clipping</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 400 }}>
            <TextField
              fullWidth
              label="Clipping Name"
              value={clippingName}
              onChange={(e) => setClippingName(e.target.value)}
              required
              margin="normal"
              sx={{
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
                }
              }}
            />
            <TextField
              fullWidth
              label="Description (optional)"
              value={clippingDescription}
              onChange={(e) => setClippingDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              sx={{
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiInputBase-input': { color: 'white' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }
                }
              }}
            />
            {clippingToSave && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  <strong>Source:</strong> {clippingToSave.sourceDatasetName}<br />
                  <strong>Boundary:</strong> {clippingToSave.boundaryDatasetName}<br />
                  <strong>Features:</strong> {clippingToSave.result.count}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => {
              setSaveDialogOpen(false);
              setClippingToSave(null);
              setClippingName('');
              setClippingDescription('');
            }}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSaveClipping}
            variant="contained"
            disabled={savingClipping || !clippingName.trim()}
            sx={{ bgcolor: '#00bcd4' }}
          >
            {savingClipping ? 'Saving...' : 'Save Clipping'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GeometryOperations;
