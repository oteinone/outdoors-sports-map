const express = require('express');
const axios = require('axios');
const { createCacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Apply caching middleware for announcements (1h TTL)
router.use(createCacheMiddleware('announcement'));

// Proxy route for announcements
router.get('/', async (req, res) => {
  try {
    const baseUrl = 'https://api.hel.fi/servicemap/v2/announcement/';
    
    // Forward all query parameters
    const queryString = Object.keys(req.query).length > 0 
      ? '?' + new URLSearchParams(req.query).toString()
      : '';
    
    const url = baseUrl + queryString;
    
    console.log(`Fetching from: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Outdoors-Sports-Map-Backend/1.0'
      }
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Announcements API Error:', error.message);
    
    // For server errors, timeouts, and network issues, let cache middleware handle stale fallback
    if (res.shouldTryStaleCache && res.shouldTryStaleCache(error)) {
      if (error.code === 'ECONNABORTED') {
        return res.status(504).json({ 
          error: 'Gateway timeout', 
          message: 'Announcements API is not responding' 
        });
      }
      
      if (error.response && error.response.status >= 500) {
        return res.status(error.response.status).json({
          error: 'API Server Error',
          message: error.response.data || error.message
        });
      }
      
      // Network/connection error
      return res.status(503).json({ 
        error: 'Service unavailable', 
        message: 'Failed to connect to announcements API' 
      });
    }
    
    // Client errors (4xx) - don't use stale cache, return error directly
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'API Error',
        message: error.response.data || error.message
      });
    }
    
    // Other errors
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to fetch announcements data' 
    });
  }
});

module.exports = router;