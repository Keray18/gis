GeoAnalytics – Full-Stack GIS & Terrain Analytics Platform
=========================================================

GeoAnalytics is a full-stack GIS and terrain analytics platform that combines a
powerful Node.js geospatial backend with a modern React + Leaflet web frontend.
It enables users to upload, manage, visualize, and analyze spatial datasets
(vectors and rasters) through an interactive web-based map interface.

The platform is designed for advanced spatial analysis workflows, including
terrain analytics on GeoTIFFs, spatial queries, and layer-based visualization.


---------------------------------------------------------
FEATURES
---------------------------------------------------------

1. Interactive GIS Web Application (Frontend)

- Dark-themed interactive map viewer
- Multiple basemaps:
  - OpenStreetMap
  - Satellite
  - Terrain
  - Hybrid
  - Dark
- Layer management:
  - Base layers
  - Demo layers
  - Uploaded vector layers
  - Raster layers
- Server-driven layers fetched dynamically from the backend
- Attribute and spatial queries with result highlighting
- Measurement tools for distance/path measurement
- User location tools with accuracy circle and smart zoom
- Feature editing:
  - Create, update, delete vector features
- Raster styling controls:
  - Color ramps
  - Band selection
  - Opacity
  - Rendering options
- Terrain analysis panel for raster datasets
- Clippings & overlays:
  - Visualization of precomputed analysis layers
- Alerts panel UI (earthquake, flood, disaster alerts – extensible)
- JWT-authenticated experience
- Drawer-based navigation (Map, Layers, Data, Admin, etc.)

---------------------------------------------------------
2. GeoAnalytics Backend (Node.js / Express)

- Node.js + Express REST API
- MongoDB with Mongoose ODM
- JWT-based authentication
- Role-based access control (admin / user)
- Secure password handling (bcrypt)

Dataset Management:
- Upload spatial datasets (up to 500MB, configurable):
  - GeoJSON
  - Shapefile
  - KML
  - GeoTIFF
  - CSV
  - GPX
- Automatic format detection
- Processing pipeline with validation and error handling
- Export capabilities (GeoJSON / CSV)
- Feature-level access with:
  - Pagination
  - Bounding-box filtering
  - Attribute-based filters

Layer Management:
- Vector and raster layers linked to datasets
- Layer styling:
  - Simple styles
  - Category-based styles
- Layer properties:
  - Opacity
  - Visibility
  - Ordering
- APIs for:
  - Updating styles
  - Toggling visibility
  - Reordering layers

Spatial & Analytical Services:
- Spatial queries:
  - Buffer
  - Point-in-polygon
  - Bounding-box search
  - Attribute filters
- Advanced analytics:
  - Spatial joins
  - Nearest-feature queries
  - Descriptive statistics
- Raster processing using:
  - geotiff
  - geoblaze
  - @turf/turf
- Terrain analysis APIs:
  - Elevation statistics
  - Slope & aspect
  - Terrain-derived metrics

Documentation & Tooling:
- API documentation
- Terrain analysis guides
- File format support docs
- Postman collections
- Test upload scripts
- Troubleshooting guides


---------------------------------------------------------
TECH STACK
---------------------------------------------------------

Frontend (gis):
- React (Create React App)
- Leaflet / React Leaflet
- Material UI (MUI)
- JWT-based authentication

Backend (GeoAnalytics-Backend):
- Node.js
- Express
- MongoDB
- Mongoose
- Multer (file uploads)
- GeoTIFF / GeoBlaze / Turf.js
- CSV / KML / GPX parsers
- JWT, bcrypt, CORS


---------------------------------------------------------
MONOREPO STRUCTURE
---------------------------------------------------------

.
├─ GeoAnalytics-Backend/
│  ├─ src/
│  │  ├─ models/        # User, Dataset, Layer, Project, Clipping, etc.
│  │  ├─ controllers/   # Auth, datasets, layers, raster, terrain, projects
│  │  ├─ services/      # Spatial & raster processing logic
│  │  ├─ routes/        # REST API routes
│  │  └─ app.js
│  ├─ uploads/          # Uploaded geospatial files
│  ├─ ENV_SETUP.md
│  ├─ API_DOCUMENTATION.md
│  ├─ TERRAIN_ANALYSIS_API.md
│  ├─ TERRAIN_ANALYSIS_GUIDE.md
│  ├─ FILE_FORMAT_SUPPORT.md
│  └─ README.md
│
└─ gis/
   ├─ src/
   │  ├─ components/    # MapView, LayerManager, DataManager, AdminDashboard
   │  ├─ pages/         # Authentication pages
   │  └─ services/
   │     └─ api.js      # Backend API client
   └─ package.json


---------------------------------------------------------
USE CASES
---------------------------------------------------------

- GIS data visualization and exploration
- Terrain and elevation analysis
- Spatial analytics dashboards
- Disaster risk and alert visualization
- Research and academic GIS projects
- Internal geospatial tooling for organizations


---------------------------------------------------------
STATUS
---------------------------------------------------------

This project is actively developed and structured for extensibility.
Several analytical components include placeholders for future
enhancements (e.g., advanced style analysis, originality detection).


---------------------------------------------------------
LICENSE
---------------------------------------------------------

Specify your license here (e.g., MIT, Apache 2.0).


---------------------------------------------------------
AUTHOR
---------------------------------------------------------

Developed by: [Your Name / Organization]

