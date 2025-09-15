import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  ScatterPlot as ScatterPlotIcon,
  Map as MapIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const DataVisualization = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedChart, setSelectedChart] = useState('line');
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Sample data for different visualizations
  const lineChartData = [
    { name: 'Jan', users: 400, maps: 24, projects: 8 },
    { name: 'Feb', users: 300, maps: 13, projects: 12 },
    { name: 'Mar', users: 200, maps: 98, projects: 15 },
    { name: 'Apr', users: 278, maps: 39, projects: 18 },
    { name: 'May', users: 189, maps: 48, projects: 22 },
    { name: 'Jun', users: 239, maps: 38, projects: 25 },
    { name: 'Jul', users: 349, maps: 43, projects: 28 },
    { name: 'Aug', users: 420, maps: 52, projects: 32 },
    { name: 'Sep', users: 380, maps: 45, projects: 35 },
    { name: 'Oct', users: 450, maps: 58, projects: 38 },
    { name: 'Nov', users: 520, maps: 62, projects: 42 },
    { name: 'Dec', users: 600, maps: 68, projects: 45 }
  ];

  const barChartData = [
    { name: 'Urban Planning', value: 45, color: '#8884d8' },
    { name: 'Environmental', value: 32, color: '#82ca9d' },
    { name: 'Disaster Risk', value: 28, color: '#ffc658' },
    { name: 'Agriculture', value: 25, color: '#ff7c7c' },
    { name: 'Infrastructure', value: 20, color: '#8dd1e1' },
    { name: 'Transportation', value: 18, color: '#d084d0' }
  ];

  const pieChartData = [
    { name: 'Active Projects', value: 35, color: '#00bcd4' },
    { name: 'Completed Projects', value: 28, color: '#4caf50' },
    { name: 'Pending Projects', value: 15, color: '#ff9800' },
    { name: 'Cancelled Projects', value: 5, color: '#f44336' }
  ];

  const scatterData = [
    { x: 100, y: 200, z: 200, name: 'Project A' },
    { x: 120, y: 100, z: 260, name: 'Project B' },
    { x: 170, y: 300, z: 400, name: 'Project C' },
    { x: 140, y: 250, z: 280, name: 'Project D' },
    { x: 200, y: 150, z: 320, name: 'Project E' },
    { x: 110, y: 130, z: 190, name: 'Project F' }
  ];

  const radarData = [
    { subject: 'Performance', A: 120, B: 110, fullMark: 150 },
    { subject: 'Quality', A: 98, B: 130, fullMark: 150 },
    { subject: 'Efficiency', A: 86, B: 130, fullMark: 150 },
    { subject: 'Innovation', A: 99, B: 100, fullMark: 150 },
    { subject: 'Collaboration', A: 85, B: 90, fullMark: 150 },
    { subject: 'Delivery', A: 65, B: 85, fullMark: 150 }
  ];

  const areaChartData = [
    { name: 'Q1', revenue: 4000, cost: 2400, profit: 1600 },
    { name: 'Q2', revenue: 3000, cost: 1398, profit: 1602 },
    { name: 'Q3', revenue: 2000, cost: 9800, profit: -7800 },
    { name: 'Q4', revenue: 2780, cost: 3908, profit: -1128 },
    { name: 'Q5', revenue: 1890, cost: 4800, profit: -2910 },
    { name: 'Q6', revenue: 2390, cost: 3800, profit: -1410 }
  ];

  const renderChart = () => {
    switch (selectedChart) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#8884d8" name="Users" strokeWidth={2} />
              <Line type="monotone" dataKey="maps" stroke="#82ca9d" name="Maps Created" strokeWidth={2} />
              <Line type="monotone" dataKey="projects" stroke="#ffc658" name="Projects" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={scatterData}>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name="Budget" unit="k" />
              <YAxis type="number" dataKey="y" name="Duration" unit="days" />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter dataKey="z" fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis />
              <Radar name="Team A" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name="Team B" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={areaChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="cost" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Data Visualization Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ borderColor: '#00bcd4', color: '#00bcd4' }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            sx={{ borderColor: '#00bcd4', color: '#00bcd4' }}
          >
            Share
          </Button>
        </Box>
      </Box>

      {/* Control Panel */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={selectedChart}
                onChange={(e) => setSelectedChart(e.target.value)}
                label="Chart Type"
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
                <MenuItem value="scatter">Scatter Plot</MenuItem>
                <MenuItem value="radar">Radar Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="1month">1 Month</MenuItem>
                <MenuItem value="3months">3 Months</MenuItem>
                <MenuItem value="6months">6 Months</MenuItem>
                <MenuItem value="1year">1 Year</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Metric</InputLabel>
              <Select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                label="Metric"
              >
                <MenuItem value="all">All Metrics</MenuItem>
                <MenuItem value="users">Users</MenuItem>
                <MenuItem value="projects">Projects</MenuItem>
                <MenuItem value="revenue">Revenue</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              sx={{ bgcolor: '#00bcd4' }}
            >
              Refresh Data
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Chart Area */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {selectedChart === 'line' && 'User Activity & Project Growth'}
                {selectedChart === 'bar' && 'Project Categories Distribution'}
                {selectedChart === 'pie' && 'Project Status Overview'}
                {selectedChart === 'scatter' && 'Budget vs Duration Analysis'}
                {selectedChart === 'radar' && 'Team Performance Comparison'}
                {selectedChart === 'area' && 'Revenue & Cost Analysis'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Settings">
                  <IconButton>
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Fullscreen">
                  <IconButton>
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {renderChart()}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Key Metrics */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Key Metrics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <TrendingUpIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Total Users"
                  secondary="1,247 (+12% this month)"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AnalyticsIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Active Projects"
                  secondary="35 (+5 this week)"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <MapIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="Maps Created"
                  secondary="156 (+8 this week)"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingDownIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="Avg. Response Time"
                  secondary="2.3s (-0.5s improvement)"
                />
              </ListItem>
            </List>
          </Paper>

          {/* Quick Stats */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Data Processing
                </Typography>
                <Typography variant="h6">98.5%</Typography>
                <Typography variant="caption" color="success.main">
                  +2.1% from last month
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  System Uptime
                </Typography>
                <Typography variant="h6">99.9%</Typography>
                <Typography variant="caption" color="success.main">
                  Excellent performance
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Storage Used
                </Typography>
                <Typography variant="h6">2.3 GB</Typography>
                <Typography variant="caption" color="warning.main">
                  75% of allocated space
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Additional Charts Row */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Geographic Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#00bcd4" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={areaChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#00bcd4" fill="#00bcd4" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Data Sources */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Sources & Integration
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MapIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">OpenStreetMap</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Real-time geographic data
                </Typography>
                <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Census Data</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Population and demographic data
                </Typography>
                <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Weather API</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Real-time weather information
                </Typography>
                <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FilterIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Custom Data</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  User-uploaded datasets
                </Typography>
                <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DataVisualization;

