// src/middlewares/hmacMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * HMAC middleware for internal server-to-server authentication.
 * Verifies x-internal-signature header against request body.
 * Matches the pattern used in Next.js API routes.
 */
export const requireHMAC = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.INTERNAL_API_KEY;
  if (!secret) {
    console.error('INTERNAL_API_KEY not configured');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const signature = req.headers['x-internal-signature'] as string;
  if (!signature) {
    return res.status(401).json({ error: 'Missing x-internal-signature header' });
  }

  // For GET/HEAD requests, payload might be empty or query string
  let payload = '';
  if (req.method === 'GET' || req.method === 'HEAD') {
    // Check if signature is for query string (e.g., "course_id=...")
    const queryString = new URLSearchParams(req.query as any).toString();
    payload = queryString || '';
  } else {
    // POST/PUT/DELETE: use body
    payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  if (signature !== expected) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};
