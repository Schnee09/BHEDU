// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: 'Invalid token' });
    (req as any).user = data.user; // attaches supabase user object
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
