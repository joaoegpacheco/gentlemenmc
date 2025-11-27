/**
 * Rate limiting middleware for API routes
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if request is rate limited
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): {
    success: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const key = identifier;

    // Get or create entry
    if (!this.store[key] || this.store[key].resetTime <= now) {
      this.store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    const entry = this.store[key];

    // Check limit
    if (entry.count >= limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;

    return {
      success: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    delete this.store[identifier];
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    });
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store = {};
  }

  /**
   * Destroy rate limiter (cleanup interval)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware for Next.js API routes
 */
export async function rateLimit(
  request: Request,
  options: {
    limit?: number;
    windowMs?: number;
    identifier?: string;
  } = {}
): Promise<
  | { success: true; remaining: number; resetTime: number }
  | { success: false; error: string; resetTime: number }
> {
  const {
    limit = 100, // Max requests
    windowMs = 60000, // Time window in ms (default: 1 minute)
    identifier,
  } = options;

  // Get identifier (IP address or custom identifier)
  const id = identifier || getIdentifier(request);

  const result = rateLimiter.check(id, limit, windowMs);

  if (!result.success) {
    return {
      success: false,
      error: 'Too many requests. Please try again later.',
      resetTime: result.resetTime,
    };
  }

  return {
    success: true as const,
    remaining: result.remaining,
    resetTime: result.resetTime,
  };
}

/**
 * Get request identifier (IP address)
 */
function getIdentifier(request: Request): string {
  // Try to get IP from headers (for proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}

/**
 * Preset rate limit configurations
 */
export const RATE_LIMITS = {
  STRICT: { limit: 10, windowMs: 60000 }, // 10 requests per minute
  MODERATE: { limit: 50, windowMs: 60000 }, // 50 requests per minute
  RELAXED: { limit: 100, windowMs: 60000 }, // 100 requests per minute
  AUTH: { limit: 5, windowMs: 900000 }, // 5 attempts per 15 minutes
  FILE_UPLOAD: { limit: 10, windowMs: 3600000 }, // 10 uploads per hour
};

/**
 * Higher-order function for rate-limited API routes
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  options: {
    limit?: number;
    windowMs?: number;
    identifier?: (request: Request) => string;
  } = {}
) {
  return async (request: Request): Promise<Response> => {
    const identifier = options.identifier?.(request);
    const result = await rateLimit(request, {
      ...options,
      identifier,
    });

    if (!result.success) {
      return rateLimitResponse(result.resetTime);
    }

    // Add rate limit headers
    const response = await handler(request);
    
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    return response;
  };
}

export default rateLimiter;

