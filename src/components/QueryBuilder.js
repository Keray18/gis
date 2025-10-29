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
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Slider,
  Autocomplete
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocationOn as LocationIcon,
  Clear as ClearIcon,
  PlayArrow as ExecuteIcon
} from '@mui/icons-material';
import {
  getDatasetFields,
  advancedAttributeFilter,
  spatialQuery,
  combinedQuery,
  listDatasets
} from '../services/api';

const QueryBuilder = ({ onResultsUpdate, onQueryExecute }) => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [datasetFields, setDatasetFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [queryType, setQueryType] = useState('attribute'); // 'attribute', 'spatial', 'combined'
  
  // Attribute query state
  const [attributeCriteria, setAttributeCriteria] = useState({
    logic: 'AND',
    conditions: []
  });
  
  // Spatial query state
  const [spatialCriteria, setSpatialCriteria] = useState({
    bounds: null,
    buffer: null,
    polygon: null
  });
  
  // Combined query state
  const [combinedCriteria, setCombinedCriteria] = useState({
    spatial: null,
    attribute: null
  });
  
  // Results state
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      loadDatasetFields(selectedDataset);
    }
  }, [selectedDataset]);

  useEffect(() => {
    console.log('Datasets state changed:', datasets);
    console.log('Datasets length:', datasets.length);
    if (datasets.length > 0) {
      console.log('First dataset:', datasets[0]);
    }
  }, [datasets]);

  const loadDatasets = async () => {
    try {
      console.log('Loading datasets...');
      const response = await listDatasets();
      console.log('Full response:', response);
      console.log('Response success:', response.success);
      console.log('Response data:', response.data);
      console.log('Response data.datasets:', response.data?.datasets);
      
      if (response.success) {
        const datasets = response.data.datasets || response.data || [];
        console.log('Final datasets array:', datasets);
        console.log('Datasets length:', datasets.length);
        console.log('First dataset:', datasets[0]);
        setDatasets(datasets);
      } else {
        console.error('Failed to load datasets:', response);
        setDatasets([]);
      }
    } catch (error) {
      console.error('Error loading datasets:', error);
      setDatasets([]);
    }
  };

  const loadDatasetFields = async (datasetId) => {
    try {
      const response = await getDatasetFields(datasetId);
      if (response.success) {
        setDatasetFields(response.data.fields || []);
      }
    } catch (error) {
      console.error('Error loading dataset fields:', error);
    }
  };

  const addAttributeCondition = () => {
    setAttributeCriteria(prev => ({
      ...prev,
      conditions: [...prev.conditions, {
        field: '',
        operator: 'equals',
        value: '',
        dataType: 'string'
      }]
    }));
  };

  const updateAttributeCondition = (index, field, value) => {
    setAttributeCriteria(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const removeAttributeCondition = (index) => {
    setAttributeCriteria(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const getOperatorsForDataType = (dataType) => {
    switch (dataType) {
      case 'number':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'greater_than', label: 'Greater Than' },
          { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
          { value: 'less_than', label: 'Less Than' },
          { value: 'less_than_or_equal', label: 'Less Than or Equal' },
          { value: 'between', label: 'Between' }
        ];
      case 'date':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'greater_than', label: 'After' },
          { value: 'greater_than_or_equal', label: 'On or After' },
          { value: 'less_than', label: 'Before' },
          { value: 'less_than_or_equal', label: 'On or Before' },
          { value: 'between', label: 'Between' }
        ];
      default:
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'not_contains', label: 'Does Not Contain' },
          { value: 'starts_with', label: 'Starts With' },
          { value: 'ends_with', label: 'Ends With' },
          { value: 'regex', label: 'Regex' }
        ];
    }
  };

  const executeQuery = async () => {
    if (!selectedDataset) {
      alert('Please select a dataset');
      return;
    }

    setLoading(true);
    try {
      let result;
      
      switch (queryType) {
        case 'attribute':
          if (attributeCriteria.conditions.length === 0) {
            alert('Please add at least one condition');
            return;
          }
          result = await advancedAttributeFilter(selectedDataset, attributeCriteria);
          break;
          
        case 'spatial':
          result = await spatialQuery(selectedDataset, spatialCriteria);
          break;
          
        case 'combined':
          result = await combinedQuery(selectedDataset, combinedCriteria);
          break;
          
        default:
          throw new Error('Invalid query type');
      }

      setResults(result.data);
      setShowResults(true);
      
      if (onResultsUpdate) {
        onResultsUpdate(result.data);
      }
      
      if (onQueryExecute) {
        onQueryExecute(result.data);
      }
      
    } catch (error) {
      console.error('Query execution failed:', error);
      alert('Query execution failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearQuery = () => {
    setAttributeCriteria({ logic: 'AND', conditions: [] });
    setSpatialCriteria({ bounds: null, buffer: null, polygon: null });
    setCombinedCriteria({ spatial: null, attribute: null });
    setResults(null);
    setShowResults(false);
  };

  const renderAttributeQuery = () => (
    <Box>
       {/* Logic Selection with Clear Explanation */}
       <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,188,212,0.1)', borderRadius: 2 }}>
         <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
           🔗 How to Combine Conditions
         </Typography>
         <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
           <Box sx={{ minWidth: 120, mr: 2 }}>
             <Typography variant="body2" gutterBottom>
               <strong>Logic:</strong>
             </Typography>
             <select
               value={attributeCriteria.logic}
               onChange={(e) => setAttributeCriteria(prev => ({ ...prev, logic: e.target.value }))}
               style={{
                 width: '100%',
                 padding: '8px',
                 border: '2px solid #00bcd4',
                 borderRadius: '6px',
                 fontSize: '14px',
                 backgroundColor: 'white',
                 fontWeight: 'bold'
               }}
             >
               <option value="AND">AND - All conditions must match</option>
               <option value="OR">OR - Any condition can match</option>
             </select>
           </Box>
           
           <Button
             startIcon={<AddIcon />}
             onClick={addAttributeCondition}
             variant="contained"
             size="small"
             sx={{ 
               bgcolor: '#4caf50',
               '&:hover': { bgcolor: '#45a049' }
             }}
           >
             + Add Filter
           </Button>
         </Box>
         
         <Typography variant="caption" color="textSecondary">
           <strong>{attributeCriteria.logic === 'AND' ? 'AND Example:' : 'OR Example:'}</strong>
           {attributeCriteria.logic === 'AND' ? 
             ' "Name = India" AND "Population > 1M" = Find places named India with population over 1 million' :
             ' "Name = Delhi" OR "Name = Mumbai" = Find places named Delhi OR Mumbai (or both)"'
           }
         </Typography>
       </Box>

      {attributeCriteria.conditions.length === 0 && (
        <Box sx={{ mb: 2, p: 3, bgcolor: 'rgba(76,175,80,0.1)', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#4caf50', fontWeight: 'bold' }}>
            🚀 Ready to Search Your Data!
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Click <strong>"+ Add Filter"</strong> above to start building your query
          </Typography>
          <Typography variant="caption" color="textSecondary">
            <strong>Quick Start:</strong> Select a field → Choose how to compare → Enter your value → Click Execute Query
          </Typography>
        </Box>
      )}

      {attributeCriteria.conditions.map((condition, index) => (
        <Card key={index} sx={{ mb: 2, border: '2px solid #e0e0e0', borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#00bcd4' }}>
                Filter #{index + 1}
              </Typography>
              <Box sx={{ flex: 1 }} />
              <IconButton
                onClick={() => removeAttributeCondition(index)}
                color="error"
                size="small"
                sx={{ 
                  bgcolor: '#ffebee',
                  '&:hover': { bgcolor: '#ffcdd2' }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    📊 Field to Search
                  </Typography>
                  <select
                    value={condition.field}
                    onChange={(e) => {
                      const field = datasetFields.find(f => f.name === e.target.value);
                      updateAttributeCondition(index, 'field', e.target.value);
                      updateAttributeCondition(index, 'dataType', field?.type || 'string');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #00bcd4',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Choose a field...</option>
                    {datasetFields.map(field => (
                      <option key={field.name} value={field.name}>
                        {field.name} ({field.type})
                      </option>
                    ))}
                  </select>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <Box>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    🔍 How to Compare
                  </Typography>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateAttributeCondition(index, 'operator', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #4caf50',
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: 'white'
                    }}
                  >
                    {getOperatorsForDataType(condition.dataType).map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    ✏️ Value to Match
                  </Typography>
                  <TextField
                    fullWidth
                    value={condition.value}
                    onChange={(e) => updateAttributeCondition(index, 'value', e.target.value)}
                    placeholder={condition.operator === 'between' ? 'min,max (e.g., 100,1000)' : 
                                condition.dataType === 'number' ? 'Enter number (e.g., 1000000)' :
                                'Enter text (e.g., India)'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        border: '2px solid #ff9800',
                        borderRadius: '6px',
                        '&:hover': {
                          border: '2px solid #f57c00'
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
            
            {/* Preview of the condition */}
            {condition.field && condition.operator && condition.value && (
              <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,188,212,0.1)', borderRadius: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  <strong>Preview:</strong> Find features where <strong>{condition.field}</strong> {condition.operator} <strong>"{condition.value}"</strong>
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderSpatialQuery = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Spatial queries will be implemented with drawing tools on the map
      </Alert>
      
      <FormControlLabel
        control={
          <Switch
            checked={spatialCriteria.bounds !== null}
            onChange={(e) => setSpatialCriteria(prev => ({
              ...prev,
              bounds: e.target.checked ? { minX: 0, minY: 0, maxX: 0, maxY: 0 } : null
            }))}
          />
        }
        label="Use Bounding Box"
      />
      
      {spatialCriteria.bounds && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Bounding Box (will be set by map interaction)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min X"
                type="number"
                value={spatialCriteria.bounds.minX}
                onChange={(e) => setSpatialCriteria(prev => ({
                  ...prev,
                  bounds: { ...prev.bounds, minX: parseFloat(e.target.value) }
                }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Y"
                type="number"
                value={spatialCriteria.bounds.minY}
                onChange={(e) => setSpatialCriteria(prev => ({
                  ...prev,
                  bounds: { ...prev.bounds, minY: parseFloat(e.target.value) }
                }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max X"
                type="number"
                value={spatialCriteria.bounds.maxX}
                onChange={(e) => setSpatialCriteria(prev => ({
                  ...prev,
                  bounds: { ...prev.bounds, maxX: parseFloat(e.target.value) }
                }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Y"
                type="number"
                value={spatialCriteria.bounds.maxY}
                onChange={(e) => setSpatialCriteria(prev => ({
                  ...prev,
                  bounds: { ...prev.bounds, maxY: parseFloat(e.target.value) }
                }))}
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );

  const renderCombinedQuery = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Combined queries use both spatial and attribute criteria
      </Alert>
      
      <Typography variant="h6" gutterBottom>
        Spatial Criteria
      </Typography>
      {renderSpatialQuery()}
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        Attribute Criteria
      </Typography>
      {renderAttributeQuery()}
    </Box>
  );

  return (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Advanced Query Builder</Typography>
      </Box>

      {/* Quick Tips */}
      <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255,193,7,0.1)', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#ff9800' }}>
          💡 Quick Tips
        </Typography>
        <Typography variant="caption" color="textSecondary">
          • <strong>AND</strong> = Find features that match ALL conditions (more specific)<br/>
          • <strong>OR</strong> = Find features that match ANY condition (more inclusive)<br/>
          • Use <strong>Contains</strong> to search for partial text matches<br/>
          • Use <strong>Greater Than</strong> for numbers (e.g., population > 1000000)
        </Typography>
      </Box>

       {/* Dataset Selection - Using HTML Select */}
       <Box sx={{ mb: 2 }}>
         <Typography variant="subtitle2" gutterBottom>
           Select Dataset
         </Typography>
         <select
           value={selectedDataset}
           onChange={(e) => {
             console.log('Dataset selected:', e.target.value);
             setSelectedDataset(e.target.value);
           }}
           style={{
             width: '100%',
             padding: '12px',
             border: '1px solid #ccc',
             borderRadius: '4px',
             fontSize: '14px',
             backgroundColor: 'white'
           }}
         >
           <option value="">Choose a dataset...</option>
           {datasets.map((dataset, index) => {
             const datasetId = dataset._id || dataset.id;
             const featureCount = dataset.featureCount || dataset.features?.length || 0;
             const datasetName = dataset.name || `Dataset ${datasetId}`;
             
             return (
               <option key={datasetId} value={datasetId}>
                 {datasetName} ({featureCount} features)
               </option>
             );
           })}
         </select>
       </Box>
      
       {/* Debug Info */}
       <Box sx={{ mb: 2, p: 1, bgcolor: 'rgba(0,0,0,0.1)', borderRadius: 1 }}>
         <Typography variant="caption" color="textSecondary">
           Debug: {datasets.length} datasets loaded
         </Typography>
         {datasets.length > 0 && (
           <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
             ✓ Datasets loaded successfully
           </Typography>
         )}
         <Button 
           size="small" 
           onClick={loadDatasets}
           sx={{ ml: 1 }}
         >
           Refresh Datasets
         </Button>
         
         {datasets.length === 0 && (
           <Box sx={{ mt: 1 }}>
             <Typography variant="caption" color="error">
               No datasets found. Try refreshing or check if you have uploaded any datasets.
             </Typography>
           </Box>
         )}
         
         {datasets.length > 0 && (
           <Box sx={{ mt: 1 }}>
             <Typography variant="caption" color="textSecondary">
               Available datasets: {datasets.map(d => d.name || 'Unnamed').join(', ')}
             </Typography>
           </Box>
         )}
       </Box>

       {/* Query Type Selection - Using HTML Select */}
       <Box sx={{ mb: 2 }}>
         <Typography variant="subtitle2" gutterBottom>
           Query Type
         </Typography>
         <select
           value={queryType}
           onChange={(e) => setQueryType(e.target.value)}
           style={{
             width: '100%',
             padding: '12px',
             border: '1px solid #ccc',
             borderRadius: '4px',
             fontSize: '14px',
             backgroundColor: 'white'
           }}
         >
           <option value="attribute">Attribute Query - Filter by data properties (e.g., population > 100000)</option>
           <option value="spatial">Spatial Query - Filter by location (e.g., within bounding box)</option>
           <option value="combined">Combined Query - Both attribute and spatial filters</option>
         </select>
       </Box>
       
       {/* Query Type Explanation */}
       <Box sx={{ mb: 2, p: 1, bgcolor: 'rgba(0,188,212,0.1)', borderRadius: 1 }}>
         <Typography variant="caption" color="textSecondary">
           <strong>{queryType === 'attribute' ? 'Attribute Query:' : 
                   queryType === 'spatial' ? 'Spatial Query:' : 'Combined Query:'}</strong>
           {queryType === 'attribute' ? ' Filter features based on their data properties like name, population, date, etc.' :
            queryType === 'spatial' ? ' Filter features based on their geographic location and spatial relationships.' :
            ' Combine both attribute and spatial criteria for complex filtering.'}
         </Typography>
       </Box>

      {/* Query Builder */}
      {selectedDataset && (
        <Box sx={{ mb: 2 }}>
          {queryType === 'attribute' && renderAttributeQuery()}
          {queryType === 'spatial' && renderSpatialQuery()}
          {queryType === 'combined' && renderCombinedQuery()}
        </Box>
      )}

      {/* Action Buttons with Help */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button
            startIcon={<ExecuteIcon />}
            onClick={executeQuery}
            variant="contained"
            disabled={loading || !selectedDataset || attributeCriteria.conditions.length === 0}
            sx={{ 
              bgcolor: '#00bcd4',
              '&:hover': { bgcolor: '#00acc1' },
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {loading ? <CircularProgress size={20} /> : '🔍 Execute Query'}
          </Button>
          
          <Button
            startIcon={<ClearIcon />}
            onClick={clearQuery}
            variant="outlined"
            color="error"
            sx={{ fontWeight: 'bold' }}
          >
            🗑️ Clear All
          </Button>
        </Box>
        
        {!selectedDataset && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
            ⚠️ Please select a dataset first
          </Typography>
        )}
        
        {selectedDataset && attributeCriteria.conditions.length === 0 && (
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1 }}>
            ⚠️ Please add at least one filter condition
          </Typography>
        )}
        
        {selectedDataset && attributeCriteria.conditions.length > 0 && (
          <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
            ✅ Ready to search! Click "Execute Query" to find matching features
          </Typography>
        )}
      </Box>

      {/* Results */}
      {showResults && results && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Query Results
          </Typography>
          <Alert severity="success">
            Found {results.count} features matching your criteria
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default QueryBuilder;
