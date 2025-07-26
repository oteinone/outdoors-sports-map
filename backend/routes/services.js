const express = require('express');
const axios = require('axios');
const { createCacheMiddleware } = require('../middleware/cache');
const { handleApiError } = require('../utils/apiErrorHandler');

const router = express.Router();

// Apply caching middleware for services (24h TTL)
router.use(createCacheMiddleware('service'));

// Proxy route for services
router.get('/', async (req, res) => {
  try {
    const baseUrl = 'https://api.hel.fi/servicemap/v2/service/';
    
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
    handleApiError(error, res, 'Services');
  }
});

module.exports = router;