const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const servicesRoute = require('./routes/services');
const unitsRoute = require('./routes/units');
const announcementsRoute = require('./routes/announcements');
const cacheRoute = require('./routes/cache');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/services', servicesRoute);
app.use('/api/units', unitsRoute);
app.use('/api/announcements', announcementsRoute);
app.use('/api/cache', cacheRoute);

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(frontendBuildPath));
  
  // Handle client-side routing - serve index.html for all non-API routes
  app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});