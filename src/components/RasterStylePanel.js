import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Grid,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Palette as PaletteIcon,
  Tune as TuneIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RasterStylePanel = ({ layer, onStyleUpdate, onClose }) => {
  const [style, setStyle] = useState({
    colorRamp: 'viridis',
    stretchType: 'linear',
    opacity: 1.0,
    bands: { red: 0, green: 1, blue: 2 },
    stretchParams: {
      minValue: null,
      maxValue: null,
      percentClip: 2,
      standardDeviations: 2
    },
    blendingMode: 'normal'
  });

  const [histogram, setHistogram] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const colorRamps = [
    { id: 'viridis', name: 'Viridis', colors: [[68, 1, 84], [253, 231, 37]] },
    { id: 'plasma', name: 'Plasma', colors: [[13, 8, 135], [255, 255, 255]] },
    { id: 'inferno', name: 'Inferno', colors: [[0, 0, 4], [255, 255, 255]] },
    { id: 'magma', name: 'Magma', colors: [[0, 0, 4], [255, 255, 255]] },
    { id: 'turbo', name: 'Turbo', colors: [[35, 23, 27], [255, 112, 78]] },
    { id: 'grayscale', name: 'Grayscale', colors: [[0, 0, 0], [255, 255, 255]] }
  ];

  const stretchTypes = [
    { id: 'linear', name: 'Linear' },
    { id: 'histogram', name: 'Histogram Equalization' },
    { id: 'minmax', name: 'Min-Max' },
    { id: 'percent', name: 'Percent Clip' },
    { id: 'standard', name: 'Standard Deviation' }
  ];

  const blendingModes = [
    { id: 'normal', name: 'Normal' },
    { id: 'multiply', name: 'Multiply' },
    { id: 'screen', name: 'Screen' },
    { id: 'overlay', name: 'Overlay' },
    { id: 'soft-light', name: 'Soft Light' },
    { id: 'hard-light', name: 'Hard Light' }
  ];

  useEffect(() => {
    if (layer && layer.rasterMetadata) {
      // Initialize style from layer data
      if (layer.style && layer.style.raster) {
        setStyle(prev => ({ ...prev, ...layer.style.raster }));
      }
      
      // Load histogram and statistics
      loadRasterData();
    }
  }, [layer]);

  const loadRasterData = async () => {
    if (!layer || !layer.source || !layer.source.datasetId) return;

    setLoading(true);
    setError(null);

    try {
      // Load histogram for band 0
      const datasetId = layer.source.datasetId._id || layer.source.datasetId;
      const histogramResponse = await fetch(
        `http://localhost:5000/api/raster/datasets/${datasetId}/histogram?band=0&bins=256`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (histogramResponse.ok) {
        const histogramData = await histogramResponse.json();
        console.log('Histogram data received:', histogramData);
        setHistogram(histogramData.data);
      } else {
        console.error('Failed to load histogram:', histogramResponse.status);
      }

      // Load statistics
      const statsResponse = await fetch(
        `http://localhost:5000/api/raster/datasets/${datasetId}/statistics`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Statistics data received:', statsData);
        setStatistics(statsData.data);
        
        // Set default min/max values from statistics
        if (statsData.data && statsData.data[0]) {
          const bandStats = statsData.data[0];
          setStyle(prev => ({
            ...prev,
            stretchParams: {
              ...prev.stretchParams,
              minValue: bandStats.p2,
              maxValue: bandStats.p98
            }
          }));
        }
      } else {
        console.error('Failed to load statistics:', statsResponse.status);
      }
    } catch (err) {
      console.error('Error loading raster data:', err);
      setError('Failed to load raster data');
    } finally {
      setLoading(false);
    }
  };

  const handleStyleChange = (field, value) => {
    console.log('RasterStylePanel: Style change triggered', { field, value });
    
    const newStyle = { ...style };
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newStyle[parent] = { ...newStyle[parent], [child]: value };
    } else {
      newStyle[field] = value;
    }
    
    setStyle(newStyle);
    
    // Apply changes immediately
    if (onStyleUpdate) {
      console.log('RasterStylePanel: Calling onStyleUpdate with:', newStyle);
      onStyleUpdate(newStyle);
    } else {
      console.log('RasterStylePanel: onStyleUpdate callback not provided');
    }
  };

  const handleApplyStyle = () => {
    if (onStyleUpdate) {
      onStyleUpdate(style);
    }
  };

  const handleResetStyle = () => {
    const defaultStyle = {
      colorRamp: 'viridis',
      stretchType: 'linear',
      opacity: 1.0,
      bands: { red: 0, green: 1, blue: 2 },
      stretchParams: {
        minValue: statistics?.[0]?.p2 || null,
        maxValue: statistics?.[0]?.p98 || null,
        percentClip: 2,
        standardDeviations: 2
      },
      blendingMode: 'normal'
    };
    setStyle(defaultStyle);
  };

  const formatHistogramData = () => {
    if (!histogram) return [];
    
    return histogram.binValues.map((value, index) => ({
      value,
      count: histogram.bins[index]
    }));
  };

  const getBandOptions = () => {
    if (!layer?.rasterMetadata?.bands) return [];
    return layer.rasterMetadata.bands.map((band, index) => ({
      value: index,
      label: `${band.name} (${band.dataType})`
    }));
  };

  if (!layer) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="textSecondary">
            No raster layer selected
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 500, maxHeight: '80vh', overflow: 'auto' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Raster Styling
          </Typography>
          <Button onClick={onClose} size="small">
            Close
          </Button>
        </Box>

        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {layer.name}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Color Ramp Selection */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <PaletteIcon sx={{ mr: 1 }} />
              <Typography>Color Ramp</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={1}>
              {colorRamps.map((ramp) => (
                <Grid size={6} key={ramp.id}>
                  <Card
                    sx={{
                      p: 1,
                      cursor: 'pointer',
                      border: style.colorRamp === ramp.id ? 2 : 1,
                      borderColor: style.colorRamp === ramp.id ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => handleStyleChange('colorRamp', ramp.id)}
                  >
                    <Box
                      sx={{
                        height: 20,
                        background: `linear-gradient(to right, 
                          rgb(${ramp.colors[0].join(',')}), 
                          rgb(${ramp.colors[1].join(',')}))`,
                        borderRadius: 1
                      }}
                    />
                    <Typography variant="caption" align="center" display="block">
                      {ramp.name}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Stretch Controls */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <TuneIcon sx={{ mr: 1 }} />
              <Typography>Stretch</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', color: '#00bcd4' }}>
                📊 Stretch Type
              </Typography>
              <select
                value={style.stretchType}
                onChange={(e) => handleStyleChange('stretchType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #00bcd4',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  fontWeight: 'bold'
                }}
              >
                {stretchTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </Box>

            {style.stretchType === 'linear' && (
              <>
                <TextField
                  fullWidth
                  label="Min Value"
                  type="number"
                  value={style.stretchParams.minValue || ''}
                  onChange={(e) => handleStyleChange('stretchParams.minValue', parseFloat(e.target.value) || null)}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  label="Max Value"
                  type="number"
                  value={style.stretchParams.maxValue || ''}
                  onChange={(e) => handleStyleChange('stretchParams.maxValue', parseFloat(e.target.value) || null)}
                />
              </>
            )}

            {style.stretchType === 'percent' && (
              <TextField
                fullWidth
                label="Percent Clip"
                type="number"
                value={style.stretchParams.percentClip}
                onChange={(e) => handleStyleChange('stretchParams.percentClip', parseFloat(e.target.value))}
                inputProps={{ min: 0, max: 50, step: 0.1 }}
              />
            )}

            {style.stretchType === 'standard' && (
              <TextField
                fullWidth
                label="Standard Deviations"
                type="number"
                value={style.stretchParams.standardDeviations}
                onChange={(e) => handleStyleChange('stretchParams.standardDeviations', parseFloat(e.target.value))}
                inputProps={{ min: 1, max: 5, step: 0.1 }}
              />
            )}
          </AccordionDetails>
        </Accordion>

        {/* Band Selection */}
        {layer.rasterMetadata?.bands && layer.rasterMetadata.bands.length > 1 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Band Selection</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid size={4}>
                  <FormControl fullWidth>
                    <InputLabel>Red</InputLabel>
                    <Select
                      value={style.bands.red}
                      onChange={(e) => handleStyleChange('bands.red', e.target.value)}
                      label="Red"
                    >
                      {getBandOptions().map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={4}>
                  <FormControl fullWidth>
                    <InputLabel>Green</InputLabel>
                    <Select
                      value={style.bands.green}
                      onChange={(e) => handleStyleChange('bands.green', e.target.value)}
                      label="Green"
                    >
                      {getBandOptions().map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={4}>
                  <FormControl fullWidth>
                    <InputLabel>Blue</InputLabel>
                    <Select
                      value={style.bands.blue}
                      onChange={(e) => handleStyleChange('bands.blue', e.target.value)}
                      label="Blue"
                    >
                      {getBandOptions().map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Opacity and Blending */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center">
              <VisibilityIcon sx={{ mr: 1 }} />
              <Typography>Display</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Opacity</Typography>
              <Slider
                value={style.opacity}
                onChange={(e, value) => handleStyleChange('opacity', value)}
                min={0}
                max={1}
                step={0.01}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold', color: '#00bcd4' }}>
                🎨 Blending Mode
              </Typography>
              <select
                value={style.blendingMode}
                onChange={(e) => handleStyleChange('blendingMode', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #00bcd4',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  fontWeight: 'bold'
                }}
              >
                {blendingModes.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.name}
                  </option>
                ))}
              </select>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Histogram */}
        {histogram && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>📊 Histogram</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,188,212,0.1)', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#00bcd4' }}>
                  💡 What is a Histogram?
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  A histogram shows the distribution of pixel values in your raster data. The X-axis shows pixel values (0-255), 
                  and the Y-axis shows how many pixels have each value. This helps you understand your data's brightness distribution 
                  and choose appropriate stretch parameters.
                </Typography>
              </Box>
              
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatHistogramData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="value" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Statistics */}
        {statistics && statistics.length > 0 && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>📈 Statistics</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(76,175,80,0.1)', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                  💡 What are Statistics?
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Statistics provide numerical summaries of your raster data for each band:
                  <br/>• <strong>Min/Max:</strong> Lowest and highest pixel values
                  <br/>• <strong>Mean:</strong> Average pixel value across all pixels
                  <br/>• <strong>Std:</strong> Standard deviation (how spread out the values are)
                  <br/>Use these values to set appropriate stretch parameters for better visualization.
                </Typography>
              </Box>
              
              {statistics && statistics.length > 0 ? statistics.map((stat, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">Band {stat.band + 1}</Typography>
                  <Grid container spacing={1}>
                    <Grid size={6}>
                      <Chip label={`Min: ${stat.min?.toFixed(2) || 'N/A'}`} size="small" />
                    </Grid>
                    <Grid size={6}>
                      <Chip label={`Max: ${stat.max?.toFixed(2) || 'N/A'}`} size="small" />
                    </Grid>
                    <Grid size={6}>
                      <Chip label={`Mean: ${stat.mean?.toFixed(2) || 'N/A'}`} size="small" />
                    </Grid>
                    <Grid size={6}>
                      <Chip label={`Std: ${stat.stdDev?.toFixed(2) || 'N/A'}`} size="small" />
                    </Grid>
                  </Grid>
                </Box>
              )) : (
                <Typography variant="body2" color="text.secondary">
                  Loading statistics...
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            onClick={handleApplyStyle}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            fullWidth
          >
            Apply Style
          </Button>
          <Button
            variant="outlined"
            onClick={handleResetStyle}
            fullWidth
          >
            Reset
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RasterStylePanel;
