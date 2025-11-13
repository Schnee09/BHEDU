import { Request, Response } from 'express';
import { userService } from '../services/userService';

export const userController = {
  async list(req: Request, res: Response) {
    try {
  const profiles = await userService.getAll();
  res.json(profiles);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const id = req.params.id;
  const profile = await userService.getById(id);
  res.json(profile);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async me(req: Request, res: Response) {
    try {
  const authUser = (req as any).user;
  const data = await userService.getById(authUser.id);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const profile = req.body;
      if (!profile.full_name || !profile.role) {
        return res.status(400).json({ error: 'full_name and role required' });
      }
      const data = await userService.create(profile);
      res.status(201).json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const authUser = (req as any).user;
      // only allow self update unless admin/teacher
      if (authUser.id !== id && !['admin', 'teacher'].includes(authUser.user_metadata?.role))
        return res.status(403).json({ error: 'Permission denied' });

      const data = await userService.update(id, req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const authUser = (req as any).user;
      if (!['admin'].includes(authUser.user_metadata?.role))
        return res.status(403).json({ error: 'Only admin can delete users' });

      await userService.delete(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};
