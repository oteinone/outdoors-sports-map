const NodeCache = require('node-cache');

// Create cache instance
const cache = new NodeCache();

// Cache TTL configuration (in seconds)
const CACHE_TTL = {
  service: 24 * 60 * 60,      // 24 hours
  unit: 60 * 60,              // 1 hour  
  announcement: 60 * 60       // 1 hour
};

/**
 * Create cache middleware for specific endpoint type
 * @param {string} type - Cache type (service, unit, announcement)
 * @returns {Function} Express middleware function
 */
function createCacheMiddleware(type) {
  const ttl = CACHE_TTL[type] || 60 * 60; // Default 1 hour

  return (req, res, next) => {
    // Create cache key from full URL and query parameters
    const cacheKey = `${type}:${req.originalUrl}`;
    
    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache HIT for ${cacheKey}`);
      return res.json(cachedData);
    }
    
    console.log(`Cache MISS for ${cacheKey}`);
    
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Cache the response data
      cache.set(cacheKey, data, ttl);
      console.log(`Cached ${cacheKey} for ${ttl} seconds`);
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  const keys = cache.keys();
  const stats = {
    totalKeys: keys.length,
    keys: keys,
    memory: cache.getStats()
  };
  
  return stats;
}

/**
 * Clear all cache
 */
function clearCache() {
  cache.flushAll();
  console.log('Cache cleared');
}

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match keys
 */
function clearCacheByPattern(pattern) {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  
  matchingKeys.forEach(key => {
    cache.del(key);
  });
  
  console.log(`Cleared ${matchingKeys.length} cache entries matching pattern: ${pattern}`);
  return matchingKeys.length;
}

module.exports = {
  createCacheMiddleware,
  getCacheStats,
  clearCache,
  clearCacheByPattern,
  CACHE_TTL
};