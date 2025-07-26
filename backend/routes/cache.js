const express = require('express');
const { getCacheStats, clearCache, clearCacheByPattern, CACHE_TTL } = require('../middleware/cache');
const { getRateLimitStatus } = require('../middleware/rateLimiter');

const router = express.Router();

// Get cache status and statistics
router.get('/status', async (req, res) => {
  try {
    const stats = getCacheStats();
    
    // Get rate limit status for this IP
    let rateLimitStatus = null;
    try {
      rateLimitStatus = await getRateLimitStatus(req);
    } catch (error) {
      console.warn('Failed to get rate limit status:', error.message);
    }
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      cache: {
        ...stats,
        ttl_config: CACHE_TTL
      },
      rateLimit: {
        enabled: true,
        limit: 10,
        windowMs: 60000,
        note: 'Rate limit only applies to cache misses',
        currentStatus: rateLimitStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get cache status',
      message: error.message
    });
  }
});
// Clear all cache
router.delete('/clear', (req, res) => {
  try {
    clearCache();
    
    res.json({
      status: 'OK',
      message: 'All cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// Clear cache by pattern
router.delete('/clear/:pattern', (req, res) => {
  try {
    const pattern = req.params.pattern;
    const clearedCount = clearCacheByPattern(pattern);
    
    res.json({
      status: 'OK',
      message: `Cleared ${clearedCount} cache entries matching pattern: ${pattern}`,
      timestamp: new Date().toISOString(),
      clearedCount
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache by pattern',
      message: error.message
    });
  }
});
module.exports = router;