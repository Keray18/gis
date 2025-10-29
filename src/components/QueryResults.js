import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Map as MapIcon,
  TableChart as TableIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const QueryResults = ({ results, onResultsUpdate, onHighlightFeatures, onClearHighlight }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [showFeatureDetails, setShowFeatureDetails] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [highlightOnMap, setHighlightOnMap] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);

  // Auto-highlight when results are loaded
  useEffect(() => {
    if (results && results.features && highlightOnMap && onHighlightFeatures) {
      console.log('Auto-highlighting results:', results.features);
      onHighlightFeatures(results.features);
    }
  }, [results, highlightOnMap, onHighlightFeatures]);

  if (!results) {
    return (
      <Paper sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="textSecondary">
          No query results to display. Execute a query to see results here.
        </Typography>
      </Paper>
    );
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFeatureSelect = (feature, isSelected) => {
    if (isSelected) {
      setSelectedFeatures(prev => [...prev, feature]);
    } else {
      setSelectedFeatures(prev => prev.filter(f => f !== feature));
    }
  };

  const handleSelectAll = () => {
    if (selectedFeatures.length === results.features.length) {
      setSelectedFeatures([]);
    } else {
      setSelectedFeatures(results.features);
    }
  };

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setShowFeatureDetails(true);
  };

  const handleHighlightToggle = () => {
    const newHighlightState = !highlightOnMap;
    setHighlightOnMap(newHighlightState);
    
    if (newHighlightState) {
      // Turn on highlighting
      if (onHighlightFeatures && results.features) {
        console.log('Highlighting features:', results.features);
        onHighlightFeatures(results.features);
      }
    } else {
      // Turn off highlighting
      if (onClearHighlight) {
        console.log('Clearing highlights');
        onClearHighlight();
      }
    }
  };

  const exportToGeoJSON = (features) => {
    const geoJSON = {
      type: "FeatureCollection",
      features: features
    };
    
    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-results-${new Date().toISOString().split('T')[0]}.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (features) => {
    if (!features || features.length === 0) return;
    
    const headers = ['id', 'geometry_type', ...Object.keys(features[0].properties || {})];
    const csvContent = [
      headers.join(','),
      ...features.map(feature => [
        feature.id || '',
        feature.geometry?.type || '',
        ...headers.slice(2).map(header => {
          const value = feature.properties?.[header] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        })
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSelected = () => {
    if (selectedFeatures.length > 0) {
      exportToGeoJSON(selectedFeatures);
    }
  };

  const handleExportAll = () => {
    if (results.features && results.features.length > 0) {
      exportToGeoJSON(results.features);
    }
  };

  const calculateStatistics = () => {
    if (!results.features || results.features.length === 0) {
      return null;
    }

    const stats = {};
    const properties = {};

    // Collect all properties
    results.features.forEach(feature => {
      if (feature.properties) {
        Object.keys(feature.properties).forEach(key => {
          if (!properties[key]) {
            properties[key] = [];
          }
          properties[key].push(feature.properties[key]);
        });
      }
    });

    // Calculate statistics for each property
    Object.keys(properties).forEach(key => {
      const values = properties[key];
      const numericValues = values.filter(v => !isNaN(parseFloat(v)) && isFinite(v));
      
      if (numericValues.length > 0) {
        const sorted = numericValues.sort((a, b) => a - b);
        stats[key] = {
          type: 'number',
          count: numericValues.length,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
          median: sorted[Math.floor(sorted.length / 2)]
        };
      } else {
        // String statistics
        const uniqueValues = [...new Set(values)];
        stats[key] = {
          type: 'string',
          count: values.length,
          uniqueCount: uniqueValues.length,
          mostCommon: uniqueValues.reduce((a, b) => 
            values.filter(v => v === a).length > values.filter(v => v === b).length ? a : b
          )
        };
      }
    });

    return stats;
  };

  const statistics = calculateStatistics();

  const renderTable = () => {
    if (!results.features || results.features.length === 0) {
      return (
        <Typography color="textSecondary" sx={{ p: 2 }}>
          No features to display
        </Typography>
      );
    }

    // Get all property keys
    const propertyKeys = new Set();
    results.features.forEach(feature => {
      if (feature.properties) {
        Object.keys(feature.properties).forEach(key => {
          propertyKeys.add(key);
        });
      }
    });

    const columns = Array.from(propertyKeys);

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedFeatures.length === results.features.length}
                      onChange={handleSelectAll}
                      size="small"
                    />
                  }
                  label="All"
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Type</TableCell>
              {columns.map(column => (
                <TableCell key={column}>{column}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.features.slice(0, 100).map((feature, index) => (
              <TableRow 
                key={index}
                hover
                selected={selectedFeatures.includes(feature)}
                onClick={() => handleFeatureClick(feature)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell padding="checkbox">
                  <Switch
                    checked={selectedFeatures.includes(feature)}
                    onChange={(e) => handleFeatureSelect(feature, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                  />
                </TableCell>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Chip 
                    label={feature.geometry.type} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </TableCell>
                {columns.map(column => (
                  <TableCell key={column}>
                    {feature.properties && feature.properties[column] 
                      ? String(feature.properties[column]).substring(0, 50)
                      : '-'
                    }
                  </TableCell>
                ))}
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      handleFeatureClick(feature);
                    }}>
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {results.features.length > 100 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">
              Showing first 100 of {results.features.length} features
            </Typography>
          </Box>
        )}
      </TableContainer>
    );
  };

  const renderStatistics = () => {
    if (!statistics) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#ff9800' }}>
            📊 No Statistics Available
          </Typography>
          <Typography color="textSecondary">
            Statistics will appear here once you have query results with data fields
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          📈 Data Analysis
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Detailed analysis of your query results - understand your data better
        </Typography>
        
        {/* Statistics Explanation */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(76,175,80,0.1)', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#4caf50' }}>
            💡 What These Statistics Mean
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>For Numbers:</strong> Min/Max = smallest/largest values, Mean = average, Median = middle value<br/>
            <strong>For Text:</strong> Unique = how many different values, Most Common = most frequent value<br/>
            <strong>Count:</strong> How many features have data for this field
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          {Object.keys(statistics).map(field => {
            const stat = statistics[field];
            return (
              <Grid item xs={12} sm={6} md={4} key={field}>
                <Card sx={{ height: '100%', border: '2px solid #e0e0e0' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: '#00bcd4', fontWeight: 'bold' }}>
                      📊 {field}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      <strong>Type:</strong> {stat.type} | <strong>Count:</strong> {stat.count}
                    </Typography>
                    
                    {stat.type === 'number' && (
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>📉 Min:</strong> {stat.min.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>📈 Max:</strong> {stat.max.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>📊 Average:</strong> {stat.mean.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>🎯 Middle:</strong> {stat.median.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                    
                    {stat.type === 'string' && (
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>🔢 Unique Values:</strong> {stat.uniqueCount}
                        </Typography>
                        <Typography variant="body2">
                          <strong>⭐ Most Common:</strong> {stat.mostCommon}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        
        {/* Practical Examples */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,193,7,0.1)', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#ff9800' }}>
            🎯 How to Use This Information
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Example:</strong> If you see "Population: Min=1000, Max=5000000, Average=250000", 
            this means your results include cities ranging from small towns (1,000 people) to large cities (5 million people), 
            with an average population of 250,000. Use this to understand the range and distribution of your data.
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderSummary = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        📊 Query Summary
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Overview of what your query found
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#e3f2fd' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                {results.count}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Features Found</strong>
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Number of matching records
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#f3e5f5' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: '#7b1fa2', fontWeight: 'bold' }}>
                {results.features && results.features.length > 0 
                  ? results.features[0].geometry.type 
                  : 'None'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Shape Type</strong>
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Point, Line, or Polygon
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#e8f5e8' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                {statistics ? Object.keys(statistics).length : 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Data Fields</strong>
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Available information columns
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', bgcolor: '#fff3e0' }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#f57c00', fontWeight: 'bold' }}>
                {selectedFeatures.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Selected</strong>
              </Typography>
              <Typography variant="caption" color="textSecondary">
                For detailed export
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* What This Means Section */}
      <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(0,188,212,0.1)', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#00bcd4' }}>
          🎯 What This Means
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Your query found <strong>{results.count} feature(s)</strong> that match your search criteria. 
          {results.count === 0 ? ' Try adjusting your filters to find more results.' :
           results.count === 1 ? ' This single feature is highlighted on the map.' :
           ` These ${results.count} features are highlighted on the map.`}
          {results.features && results.features.length > 0 && (
            <> The data includes <strong>{statistics ? Object.keys(statistics).length : 0} information fields</strong> like names, populations, or other attributes.</>
          )}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Query Results
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={highlightOnMap}
                  onChange={handleHighlightToggle}
                  size="small"
                />
              }
              label="Highlight on Map"
            />
            
            <Button
              startIcon={<DownloadIcon />}
              variant="outlined"
              size="small"
              disabled={selectedFeatures.length === 0}
              onClick={handleExportSelected}
            >
              Export Selected ({selectedFeatures.length})
            </Button>
            
            <Button
              startIcon={<DownloadIcon />}
              variant="contained"
              size="small"
              sx={{ bgcolor: '#00bcd4' }}
              onClick={handleExportAll}
            >
              Export All
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<InfoIcon />} 
            label="Summary" 
            iconPosition="start"
            sx={{ fontWeight: 'bold' }}
          />
          <Tab 
            icon={<TableIcon />} 
            label="Data Table" 
            iconPosition="start"
            sx={{ fontWeight: 'bold' }}
          />
          <Tab 
            icon={<MapIcon />} 
            label="Statistics" 
            iconPosition="start"
            sx={{ fontWeight: 'bold' }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 0 && renderSummary()}
        {activeTab === 1 && renderTable()}
        {activeTab === 2 && renderStatistics()}
      </Box>

      {/* Feature Details Dialog */}
      <Dialog
        open={showFeatureDetails}
        onClose={() => setShowFeatureDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Feature Details
            <IconButton onClick={() => setShowFeatureDetails(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedFeature && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Geometry Information
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Type: {selectedFeature.geometry.type}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Coordinates: {JSON.stringify(selectedFeature.geometry.coordinates)}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Properties
              </Typography>
              {selectedFeature.properties ? (
                <List>
                  {Object.keys(selectedFeature.properties).map(key => (
                    <ListItem key={key}>
                      <ListItemText
                        primary={key}
                        secondary={String(selectedFeature.properties[key])}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="textSecondary">No properties</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFeatureDetails(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default QueryResults;
