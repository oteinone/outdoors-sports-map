const rateLimit = require('express-rate-limit');

/**
 * Rate limiter that only applies when cache is missed
 * This protects upstream APIs from being overwhelmed while allowing fast cached responses
 */

// Create the base rate limiter
const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Limit each IP to 10 requests per windowMs for cache misses
  message: {
    error: 'Too many API requests',
    message: 'You have exceeded the rate limit for uncached requests. Please try again later.',
    retryAfter: '60 seconds'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Custom key generator - include endpoint type in the key
  keyGenerator: (req) => {
    const endpoint = req.originalUrl.split('/')[2] || 'unknown'; // Extract 'services', 'units', etc.
    return `${req.ip}:${endpoint}`;
  },

  // Don't count requests that hit the cache
  skip: (req) => {
    return req.cacheHit === true;
  },

  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    const endpoint = req.originalUrl.split('/')[2] || 'unknown';
    console.log(`Rate limit exceeded for IP ${req.ip} on ${endpoint} endpoint`);
    
    res.status(429).json({
      error: 'Too many API requests',
      message: `Rate limit exceeded for ${endpoint} API. You can make up to 10 uncached requests per minute.`,
      retryAfter: 60,
      tip: 'Cached responses are not rate limited. This request would have been allowed if data was in cache.'
    });
  }
});

/**
 * Cache-aware rate limiting middleware
 * Only applies rate limiting to requests that miss the cache
 * 
 * @param {string} type - API type for logging (services, units, announcements)
 * @returns {Function} Express middleware function
 */
function createCacheAwareRateLimit(type) {
  return (req, res, next) => {
    // Store the original res.json to detect cache hits
    const originalJson = res.json;
    let cacheHit = false;

    // Override res.json to detect if response came from cache
    res.json = function(data) {
      // Check if this response includes cache hit indicators
      // We'll set this flag in the cache middleware
      req.cacheHit = cacheHit;
      
      // Call original res.json
      return originalJson.call(this, data);
    };

    // Add method to mark cache hits
    res.markCacheHit = function() {
      cacheHit = true;
      req.cacheHit = true;
    };

    // Apply rate limiting
    apiRateLimit(req, res, (err) => {
      if (err) {
        return next(err);
      }
      
      // Continue to next middleware
      next();
    });
  };
}

/**
 * Get rate limit status for monitoring
 * @param {Object} req - Express request object
 * @returns {Object} Rate limit status
 */
function getRateLimitStatus(req) {
  const store = apiRateLimit.store;
  const key = apiRateLimit.keyGenerator(req);
  
  return store.get(key).then(result => {
    if (result) {
      return {
        requests: result.hits,
        remaining: Math.max(0, apiRateLimit.max - result.hits),
        resetTime: new Date(result.resetTime),
        windowMs: apiRateLimit.windowMs
      };
    }
    
    return {
      requests: 0,
      remaining: apiRateLimit.max,
      resetTime: new Date(Date.now() + apiRateLimit.windowMs),
      windowMs: apiRateLimit.windowMs
    };
  });
}

module.exports = {
  createCacheAwareRateLimit,
  getRateLimitStatus,
  apiRateLimit
};