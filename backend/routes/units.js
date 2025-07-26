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
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: 'Gateway timeout', 
        message: 'Units API is not responding' 
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: 'API Error',
        message: error.response.data || error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to fetch units data' 
    });
  }
});

module.exports = router;