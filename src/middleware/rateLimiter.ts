import { Request, Response, NextFunction } from 'express';
import { TokenBucketLimiter } from '../services/ratelimiter/TokenBucketLimiter';

export interface RateLimiterOptions {
  getUserId?: (req: Request) => string;
  errorMessage?: string;
  statusCode?: number;
}

const defaultOptions: Required<RateLimiterOptions> = {
  getUserId: (req: Request) => req.ip || 'anonymous',
  errorMessage: 'Rate limit exceeded. Please try again later.',
  statusCode: 429
};

export const rateLimiter = (options: RateLimiterOptions = {}) => {
  const finalOptions = { ...defaultOptions, ...options };
  const limiter = TokenBucketLimiter.getInstance();

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = finalOptions.getUserId(req);
      const result = await limiter.checkLimit(userId);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': limiter.config.tokensPerInterval.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString()
      });

      if (!result.isAllowed) {
        if (result.retryAfter) {
          res.set('Retry-After', result.retryAfter.toString());
        }
        res.status(finalOptions.statusCode).json({
          error: finalOptions.errorMessage,
          retryAfter: result.retryAfter
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next(error);
    }
  };
}; 