const { shouldTryStaleCache } = require('../middleware/cache');

/**
 * Common error handler for API proxy routes
 * Handles errors consistently across all API endpoints with stale cache fallback
 * 
 * @param {Error} error - The caught error object
 * @param {Object} res - Express response object
 * @param {string} apiName - Name of the API for error messages (e.g., 'Units', 'Services')
 */
function handleApiError(error, res, apiName) {
  console.error(`${apiName} API Error:`, error.message);
  
  // For server errors, timeouts, and network issues, let cache middleware handle stale fallback
  if (shouldTryStaleCache(error)) {
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        error: 'Gateway timeout', 
        message: `${apiName} API is not responding` 
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
      message: `Failed to connect to ${apiName} API` 
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
    message: `Failed to fetch ${apiName.toLowerCase()} data` 
  });
}

module.exports = {
  handleApiError
};