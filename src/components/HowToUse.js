/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Layers as LayersIcon,
  DataObject as DataObjectIcon,
  Create as CreateIcon,
  Map as MapIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';

const HowToUse = () => {
  return (
    <Box sx={{ p: 4, maxWidth: 900, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom color="primary" fontWeight="bold">
        How to Use GeoAnalytics Pro
      </Typography>
      <Typography variant="body1" paragraph color="text.secondary">
        Welcome to GeoAnalytics Pro, an advanced web-based GIS platform. This guide will help you understand how to navigate the application and utilize its powerful spatial analysis and data management tools.
      </Typography>

      <Paper sx={{ mt: 3, background: '#1a1a1a' }}>
        
        {/* 1. Data Management */}
        <Accordion defaultExpanded sx={{ background: 'transparent', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <DataObjectIcon color="primary" sx={{ mr: 2 }} />
            <Typography variant="h6">1. Data Management</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              The <strong>Data Manager</strong> is where you upload and manage your spatial datasets.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Uploading Vector Data" secondary="Support for GeoJSON (.geojson, .json), Shapefiles (.shp, .dbf, .shx), KML, and CSV. These files are processed into vector features (points, lines, polygons)." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Uploading Raster Data" secondary="Upload GeoTIFFs (.tif, .tiff). The system will extract metadata and bounds automatically." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Deleting & Exporting" secondary="You can delete datasets or export them as GeoJSON/CSV from the data manager table." />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
        <Divider />

        {/* 2. Map Navigation & Layers */}
        <Accordion sx={{ background: 'transparent', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <MapIcon color="primary" sx={{ mr: 2 }} />
            <Typography variant="h6">2. Map Navigation & Layers</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              The <strong>3D Map Viewer</strong> is the core of the application. It provides standard map controls along with a layer management sidebar.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Basemaps" secondary="Switch between OpenStreetMap, Satellite imagery, and Topographic basemaps using the layer control in the top right." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Vector Layers" secondary="Toggle visibility of your uploaded datasets. Each layer automatically gets a random color on load, which can be modified." />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
        <Divider />

        {/* 3. Styling & Symbology */}
        <Accordion sx={{ background: 'transparent', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <LayersIcon color="primary" sx={{ mr: 2 }} />
            <Typography variant="h6">3. Styling & Symbology</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Customize how your data appears on the map to create meaningful visualizations.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Basic Styling" secondary="Change fill color, border color, opacity, and line weight." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Category-Based Styling" secondary="Color features dynamically based on specific attribute properties (e.g. unique colors for different land use types)." />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
        <Divider />

        {/* 4. Geometry Editing */}
        <Accordion sx={{ background: 'transparent', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <CreateIcon color="primary" sx={{ mr: 2 }} />
            <Typography variant="h6">4. Geometry Editing</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Create new spatial data or modify existing features directly on the map.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Drawing Tools" secondary="Use the toolbar on the left side of the map to draw new Polygons, Lines, or Points. These will be saved to your active dataset." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Editing Tools" secondary="Click the edit button in the toolbar to drag vertices, reshape polygons, or delete features." />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>
        <Divider />

        {/* 5. Spatial Analysis */}
        <Accordion sx={{ background: 'transparent', boxShadow: 'none' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <AnalyticsIcon color="primary" sx={{ mr: 2 }} />
            <Typography variant="h6">5. Spatial Analysis</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              Perform advanced GIS operations using the side panels in the Map Viewer.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Buffer" secondary="Select a layer and apply a buffer radius (in meters) to generate new buffer polygon features around your points/lines." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Point in Polygon (PIP)" secondary="Find which points from a point layer fall inside the polygons of another layer." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Map Export" secondary="Use the export button to download a high-resolution PNG or PDF image of your current map view." />
              </ListItem>
            </List>
          </AccordionDetails>
        </Accordion>

      </Paper>
    </Box>
  );
};

export default HowToUse;

