import { Request, Response } from 'express';
import { courseService } from '../services/courseService';

export const courseController = {
  async list(req: Request, res: Response) {
    try {
      const data = await courseService.getAll();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const data = await courseService.getById(id);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const body = { ...req.body, author_id: user.id };
      const data = await courseService.create(body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const user = (req as any).user;
      const existing = await courseService.getById(id);

      if (existing.author_id !== user.id && user.user_metadata?.role !== 'admin')
        return res.status(403).json({ error: 'Permission denied' });

      const data = await courseService.update(id, req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const user = (req as any).user;
      const existing = await courseService.getById(id);

      if (existing.author_id !== user.id && user.user_metadata?.role !== 'admin')
        return res.status(403).json({ error: 'Permission denied' });

      await courseService.delete(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};

