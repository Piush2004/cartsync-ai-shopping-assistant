import { Request, Response, NextFunction } from 'express';

// In-memory store for MVP. For production, use Redis or Firestore.
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 60; // 60 requests per minute
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const record = requestCounts.get(ip)!;
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return next();
  }
  
  record.count++;
  if (record.count > maxRequests) {
    return res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
  
  next();
};
