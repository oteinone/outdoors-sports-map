const express = require('express');
const axios = require('axios');
const { createCacheMiddleware } = require('../middleware/cache');

const router = express.Router();

// Apply caching middleware for units (1h TTL)
router.use(createCacheMiddleware('unit'));

// Proxy route for units
router.get('/', async (req, res) => {
  try {
    const baseUrl = 'https://api.hel.fi/servicemap/v2/unit/';
    
    // Forward all query parameters
    const queryString = Object.keys(req.query).length > 0 
      ? '?' + new URLSearchParams(req.query).toString()
      : '';
    
    const url = baseUrl + queryString;
    
    console.log(`Fetching from: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 15000, // 15 second timeout (units can be larger responses)
      headers: {
        'User-Agent': 'Outdoors-Sports-Map-Backend/1.0'
      }
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Units API Error:', error.message);
    
    // For server errors, timeouts, and network issues, let cache middleware handle stale fallback
    if (res.shouldTryStaleCache && res.shouldTryStaleCache(error)) {
      if (error.code === 'ECONNABORTED') {
        return res.status(504).json({ 
          error: 'Gateway timeout', 
          message: 'Units API is not responding' 
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
        message: 'Failed to connect to units API' 
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
      message: 'Failed to fetch units data' 
    });
  }
});

module.exports = router;