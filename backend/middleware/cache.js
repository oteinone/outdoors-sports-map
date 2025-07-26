const NodeCache = require('node-cache');

// Create cache instances
const freshCache = new NodeCache();  // For fresh data
const staleCache = new NodeCache();  // For fallback data

// Cache TTL configuration (in seconds)
const CACHE_TTL = {
  service: {
    fresh: 24 * 60 * 60,    // 24 hours (services change rarely)
    stale: 24 * 60 * 60     // 24 hours fallback
  },
  unit: {
    fresh: 5 * 60,          // 5 minutes (units need fresh condition data)
    stale: 24 * 60 * 60     // 24 hours fallback
  },
  announcement: {
    fresh: 60 * 60,         // 1 hour
    stale: 24 * 60 * 60     // 24 hours fallback
  }
};

/**
 * Create cache middleware for specific endpoint type with fresh-first strategy
 * @param {string} type - Cache type (service, unit, announcement)
 * @returns {Function} Express middleware function
 */
function createCacheMiddleware(type) {
  const ttlConfig = CACHE_TTL[type] || { fresh: 60 * 60, stale: 24 * 60 * 60 };

  return (req, res, next) => {
    // Create cache key from full URL and query parameters
    const cacheKey = `${type}:${req.originalUrl}`;
    
    // Try to get fresh data first
    const freshData = freshCache.get(cacheKey);
    
    if (freshData) {
      // If fresh cache contains an error but stale cache has valid data, use stale
      if (freshData.error) {
        const staleData = staleCache.get(cacheKey);
        if (staleData) {
          console.log(`Fresh cache has error, serving valid stale cache for ${cacheKey}`);
          return res.json(staleData);
        } else {
          console.log('Stale cache empty for ${cacheKey}')
        }
      }
      
      console.log(`Fresh cache HIT for ${cacheKey}`);
      return res.json(freshData);
    }
    
    console.log(`Fresh cache MISS for ${cacheKey}`);
    
    // Store original res.json to intercept all responses
    const originalJson = res.json;
    
    res.json = function(data) {
      // If this is an error response, try serving stale cache first
      if (data.error) {
        const staleData = staleCache.get(cacheKey);
        if (staleData && !staleData.error) {
          console.log(`Error response received, serving stale cache instead for ${cacheKey}`);
          // Cache the error in fresh cache for rate limiting
          freshCache.set(cacheKey, data, ttlConfig.fresh);
          // Return stale data instead of error
          return originalJson.call(this, staleData);
        }
        console.log(`Error response and no valid stale cache for ${cacheKey}`);
      }
      
      // Always cache in fresh cache (both valid and error responses)
      freshCache.set(cacheKey, data, ttlConfig.fresh);
      console.log(`Cached in fresh cache ${cacheKey} for ${ttlConfig.fresh}s`);
      
      // Only cache valid responses in stale cache (for long-term fallback)
      if (!data.error) {
        staleCache.set(cacheKey, data, ttlConfig.stale);
        console.log(`Cached in stale cache ${cacheKey} for ${ttlConfig.stale}s`);
      }
      
      // Call original res.json
      return originalJson.call(this, data);
    };

    // Add helper method to check if error should trigger stale cache
    res.shouldTryStaleCache = function(error) {
      return shouldTryStaleCache(error);
    };
    
    next();
  };
}

/**
 * Check if error should trigger stale cache fallback
 * @param {Error} error - The error object to check
 * @returns {boolean} True if error should trigger stale cache
 */
function shouldTryStaleCache(error) {
  return error.code === 'ECONNABORTED' || // Timeout
         error.code === 'ECONNREFUSED' || // Connection refused
         error.code === 'ENOTFOUND' ||    // DNS resolution failed
         (error.response && error.response.status >= 500); // Server errors
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  const freshKeys = freshCache.keys();
  const staleKeys = staleCache.keys();
  
  const stats = {
    fresh: {
      totalKeys: freshKeys.length,
      keys: freshKeys,
      memory: freshCache.getStats()
    },
    stale: {
      totalKeys: staleKeys.length,
      keys: staleKeys,
      memory: staleCache.getStats()
    },
    combined: {
      totalKeys: freshKeys.length + staleKeys.length
    }
  };
  
  return stats;
}

/**
 * Clear all cache
 */
function clearCache() {
  freshCache.flushAll();
  staleCache.flushAll();
  console.log('Both fresh and stale caches cleared');
}

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match keys
 */
function clearCacheByPattern(pattern) {
  const freshKeys = freshCache.keys();
  const staleKeys = staleCache.keys();
  
  const matchingFreshKeys = freshKeys.filter(key => key.includes(pattern));
  const matchingStaleKeys = staleKeys.filter(key => key.includes(pattern));
  
  matchingFreshKeys.forEach(key => {
    freshCache.del(key);
  });
  
  matchingStaleKeys.forEach(key => {
    staleCache.del(key);
  });
  
  const totalCleared = matchingFreshKeys.length + matchingStaleKeys.length;
  console.log(`Cleared ${totalCleared} cache entries (${matchingFreshKeys.length} fresh, ${matchingStaleKeys.length} stale) matching pattern: ${pattern}`);
  return totalCleared;
}

module.exports = {
  createCacheMiddleware,
  getCacheStats,
  clearCache,
  clearCacheByPattern,
  shouldTryStaleCache,
  CACHE_TTL
};