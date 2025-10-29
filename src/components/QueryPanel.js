import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  FilterList as FilterIcon,
  TableChart as ResultsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import QueryBuilder from './QueryBuilder';
import QueryResults from './QueryResults';

const QueryPanel = ({ onResultsUpdate, onHighlightFeatures, onClearHighlight }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [queryResults, setQueryResults] = useState(null);
  const [isVisible, setIsVisible] = useState(false); // Start hidden to avoid conflicts

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleQueryExecute = (results) => {
    setQueryResults(results);
    setActiveTab(1); // Switch to results tab
  };

  const handleResultsUpdate = (results) => {
    setQueryResults(results);
    if (onResultsUpdate) {
      onResultsUpdate(results);
    }
  };

  if (!isVisible) {
    return (
      <Box sx={{ position: 'absolute', top: 80, right: 16, zIndex: 3000 }}>
        <Tooltip title="Open Advanced Query Panel">
          <IconButton
            onClick={() => setIsVisible(true)}
            sx={{ 
              bgcolor: '#00bcd4', 
              color: 'white',
              boxShadow: 4,
              '&:hover': { bgcolor: '#00acc1' },
              width: 56,
              height: 56,
              fontSize: '1.2rem'
            }}
          >
            <FilterIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: 80,
        right: 16,
        width: 500,
        height: 'calc(100vh - 100px)',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 6,
        border: '3px solid #00bcd4',
        borderRadius: 2
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">
          Advanced Query
        </Typography>
        <IconButton
          onClick={() => setIsVisible(false)}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            icon={<FilterIcon />} 
            label="Query Builder" 
            iconPosition="start"
          />
          <Tab 
            icon={<ResultsIcon />} 
            label="Results" 
            iconPosition="start"
            disabled={!queryResults}
          />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 0 && (
          <QueryBuilder 
            onResultsUpdate={handleResultsUpdate}
            onQueryExecute={handleQueryExecute}
          />
        )}
        {activeTab === 1 && (
          <QueryResults
            results={queryResults}
            onResultsUpdate={handleResultsUpdate}
            onHighlightFeatures={onHighlightFeatures}
            onClearHighlight={onClearHighlight}
          />
        )}
      </Box>
    </Paper>
  );
};

export default QueryPanel;
