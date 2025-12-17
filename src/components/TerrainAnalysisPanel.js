import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Terrain as TerrainIcon,
  TrendingUp as TrendingUpIcon,
  Explore as CompassIcon,
  Image as ImageIcon,
  ShowChart as ShowChartIcon,
  WaterDrop as WaterDropIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import {
  calculateSlope,
  calculateAspect,
  generateHillshade,
  generateContours,
  calculateWatershed,
  getTerrainAnalyses
} from '../services/api';

const TerrainAnalysisPanel = ({ dataset, onClose, onAnalysisComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [analyses, setAnalyses] = useState([]);

  // Slope parameters
  const [slopeUnit, setSlopeUnit] = useState('degrees');

  // Hillshade parameters
  const [azimuth, setAzimuth] = useState(315);
  const [altitude, setAltitude] = useState(45);

  // Contour parameters
  const [contourInterval, setContourInterval] = useState(10);

  // Watershed parameters
  const [pourPoint, setPourPoint] = useState({ x: null, y: null });
  const [watershedDialogOpen, setWatershedDialogOpen] = useState(false);

  useEffect(() => {
    if (dataset) {
      loadAnalyses();
    }
  }, [dataset]);

  const loadAnalyses = async () => {
    if (!dataset || !dataset._id) return;
    try {
      const response = await getTerrainAnalyses(dataset._id || dataset.id);
      if (response?.success && response?.data?.analyses) {
        setAnalyses(response.data.analyses);
      }
    } catch (err) {
      console.error('Error loading terrain analyses:', err);
    }
  };

  const handleAnalysis = async (analysisType, params = {}) => {
    if (!dataset || (!dataset._id && !dataset.id)) {
      setError('No dataset selected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let response;
      const datasetId = dataset._id || dataset.id;

      switch (analysisType) {
        case 'slope':
          response = await calculateSlope(datasetId, slopeUnit);
          break;
        case 'aspect':
          response = await calculateAspect(datasetId);
          break;
        case 'hillshade':
          response = await generateHillshade(datasetId, azimuth, altitude);
          break;
        case 'contours':
          response = await generateContours(datasetId, contourInterval);
          break;
        case 'watershed':
          if (!pourPoint.x || !pourPoint.y) {
            setError('Please provide pour point coordinates');
            setLoading(false);
            return;
          }
          response = await calculateWatershed(datasetId, pourPoint);
          break;
        default:
          throw new Error('Unknown analysis type');
      }

      if (response?.success) {
        setSuccess(`${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} analysis completed successfully!`);
        await loadAnalyses();
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data);
        }
        // Close watershed dialog if open
        if (analysisType === 'watershed') {
          setWatershedDialogOpen(false);
        }
      }
    } catch (err) {
      setError(err.message || `Failed to perform ${analysisType} analysis`);
      console.error(`Error performing ${analysisType} analysis:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleWatershedFromMap = () => {
    // This will be called from MapView when user clicks on map
    setWatershedDialogOpen(true);
  };

  if (!dataset) {
    return (
      <Card sx={{ p: 2 }}>
        <Alert severity="info">Please select a GeoTIFF dataset to perform terrain analysis</Alert>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 600, maxHeight: '90vh', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TerrainIcon />
          <Typography variant="h6">Terrain Analysis</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Dataset:</Typography>
          <Typography variant="body1" fontWeight="medium">{dataset.name}</Typography>
          {dataset.type !== 'GeoTIFF' && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Terrain analysis requires a GeoTIFF (DEM) file
            </Alert>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Slope Analysis */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <TrendingUpIcon />
              <Typography variant="subtitle1">Slope Analysis</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={slopeUnit}
                    label="Unit"
                    onChange={(e) => setSlopeUnit(e.target.value)}
                  >
                    <MenuItem value="degrees">Degrees</MenuItem>
                    <MenuItem value="percent">Percent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAnalysis('slope')}
                  disabled={loading || dataset.type !== 'GeoTIFF'}
                  startIcon={loading ? <CircularProgress size={20} /> : <TrendingUpIcon />}
                >
                  Calculate Slope
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Aspect Analysis */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <CompassIcon />
              <Typography variant="subtitle1">Aspect Analysis</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Calculate the compass direction of the steepest slope (0-360°)
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleAnalysis('aspect')}
              disabled={loading || dataset.type !== 'GeoTIFF'}
              startIcon={loading ? <CircularProgress size={20} /> : <CompassIcon />}
            >
              Calculate Aspect
            </Button>
          </AccordionDetails>
        </Accordion>

        {/* Hillshade Analysis */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <ImageIcon />
              <Typography variant="subtitle1">Hillshade</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Azimuth (degrees)"
                  type="number"
                  value={azimuth}
                  onChange={(e) => setAzimuth(parseFloat(e.target.value) || 315)}
                  inputProps={{ min: 0, max: 360 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Altitude (degrees)"
                  type="number"
                  value={altitude}
                  onChange={(e) => setAltitude(parseFloat(e.target.value) || 45)}
                  inputProps={{ min: 0, max: 90 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAnalysis('hillshade')}
                  disabled={loading || dataset.type !== 'GeoTIFF'}
                  startIcon={loading ? <CircularProgress size={20} /> : <ImageIcon />}
                >
                  Generate Hillshade
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Contour Analysis */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <ShowChartIcon />
              <Typography variant="subtitle1">Contour Lines</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contour Interval (meters)"
                  type="number"
                  value={contourInterval}
                  onChange={(e) => setContourInterval(parseFloat(e.target.value) || 10)}
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAnalysis('contours')}
                  disabled={loading || dataset.type !== 'GeoTIFF'}
                  startIcon={loading ? <CircularProgress size={20} /> : <ShowChartIcon />}
                >
                  Generate Contours
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Watershed Analysis */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <WaterDropIcon />
              <Typography variant="subtitle1">Watershed Analysis</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click on the map to select a pour point, or enter coordinates manually
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Longitude (X)"
                  type="number"
                  value={pourPoint.x || ''}
                  onChange={(e) => setPourPoint({ ...pourPoint, x: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 77.5"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Latitude (Y)"
                  type="number"
                  value={pourPoint.y || ''}
                  onChange={(e) => setPourPoint({ ...pourPoint, y: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 11.0"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleAnalysis('watershed')}
                  disabled={loading || dataset.type !== 'GeoTIFF' || !pourPoint.x || !pourPoint.y}
                  startIcon={loading ? <CircularProgress size={20} /> : <WaterDropIcon />}
                >
                  Calculate Watershed
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Previous Analyses */}
        {analyses.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Previous Analyses</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {analyses.map((analysis, idx) => (
                <Chip
                  key={idx}
                  label={`${analysis.name} (${analysis.type})`}
                  icon={<CheckCircleIcon />}
                  color="primary"
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start' }}
                />
              ))}
            </Box>
          </>
        )}
      </CardContent>

      {/* Watershed Dialog for Map Selection */}
      <Dialog open={watershedDialogOpen} onClose={() => setWatershedDialogOpen(false)}>
        <DialogTitle>Select Pour Point on Map</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Click on the map to select the pour point for watershed analysis. The coordinates will be automatically filled.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWatershedDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TerrainAnalysisPanel;

