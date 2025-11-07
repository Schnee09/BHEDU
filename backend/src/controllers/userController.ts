import { Request, Response } from 'express';
import { userService } from '../services/userService';

export const userController = {
  async list(req: Request, res: Response) {
    try {
      const users = await userService.getAll();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async get(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const user = await userService.getById(id);
      res.json(user);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async me(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await userService.getById(user.id);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const user = (req as any).user;

      // chỉ cho phép user tự update nếu không phải admin/teacher
      if (user.id !== id && !['admin', 'teacher'].includes(user.user_metadata?.role))
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
      const user = (req as any).user;
      if (!['admin'].includes(user.user_metadata?.role))
        return res.status(403).json({ error: 'Only admin can delete users' });

      await userService.delete(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
};
