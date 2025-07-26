# Backend API Proxy with Caching

This backend provides cached proxy endpoints for the Helsinki ServiceMap API to improve reliability when the original APIs are slow or down.

## Quick Start

1. **Start the backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Test the endpoints:**
   ```bash
   # Health check
   curl http://localhost:3001/health
   
   # Services (cached for 24h)
   curl http://localhost:3001/api/services
   
   # Units (cached for 1h) 
   curl "http://localhost:3001/api/units?service=33"
   
   # Cache status
   curl http://localhost:3001/api/cache/status
   ```

## Endpoints

| Endpoint | Original API | Cache TTL | Rate Limit | Description |
|----------|-------------|-----------|------------|-------------|
| `/api/services` | `/servicemap/v2/service/` | 24 hours | 10/min* | Service definitions |
| `/api/units` | `/servicemap/v2/unit/` | 1 hour | 10/min* | Sports facilities and units |
| `/api/announcements` | `/servicemap/v2/announcement/` | 1 hour | 10/min* | Public announcements |

*Rate limit only applies to cache misses (requests that fetch fresh data). Cached responses are unlimited.

## Cache Management

- **Status**: `GET /api/cache/status` - View cache statistics and rate limit status
- **Clear all**: `DELETE /api/cache/clear` - Clear entire cache
- **Clear pattern**: `DELETE /api/cache/clear/{pattern}` - Clear specific cache entries

## Rate Limiting

- **Limit**: 10 requests per minute per IP address per endpoint
- **Scope**: Only applies to requests that miss the cache (fetch fresh data)
- **Bypass**: All cached responses are served without rate limiting
- **Reset**: Rate limit window resets every 60 seconds
- **Headers**: Rate limit info included in response headers
- **Error**: HTTP 429 when limit exceeded with retry-after information

## Configuration

Environment variables in `.env`:
- `PORT` - Server port (default: 3001)
- `CACHE_TTL_*` - Cache TTL overrides

## Frontend Integration

The frontend is configured to use this backend by setting:
```
REACT_APP_API_URL=http://localhost:3001/api
```

All existing API calls will automatically be proxied through the caching layer.