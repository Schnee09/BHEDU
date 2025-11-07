// src/controllers/authController.ts
import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, full_name, role } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      const user = await authService.register(email, password, full_name, role);
      return res.status(201).json({ user });
    } catch (err: any) {
      return res.status(400).json({ error: err.message ?? 'register failed' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      const data = await authService.login(email, password);
      // data contains session + user (if successful)
      return res.json(data);
    } catch (err: any) {
      return res.status(401).json({ error: err.message ?? 'login failed' });
    }
  },

  // returns current user from token (requires requireAuth middleware or token handling)
  async profile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      return res.json(user);
    } catch (err: any) {
      return res.status(500).json({ error: 'failed to get profile' });
    }
  }
};
