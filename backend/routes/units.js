const express = require('express');
const axios = require('axios');
const { createCacheMiddleware } = require('../middleware/cache');
const { handleApiError } = require('../utils/apiErrorHandler');
const { createCacheAwareRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiting (only for cache misses) and caching middleware
router.use(createCacheAwareRateLimit('unit'));
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
    handleApiError(error, res, 'Units');
  }
});

module.exports = router;