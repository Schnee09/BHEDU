// src/controllers/enrollmentController.ts
import { Request, Response } from 'express';
import { enrollmentService } from '../services/enrollmentService';

// helper to get supabase user attached by requireAuth
const getActor = (req: Request) => (req as any).user;

const isTeacherOrAdmin = (actor: any) => {
  // supabase user metadata location: actor.user_metadata?.role
  return !!actor && (actor.user_metadata?.role === 'teacher' || actor.user_metadata?.role === 'admin');
};

export const enrollmentController = {
  // Enroll a user into a course.
  // Teacher/admin can enroll any user; student can enroll themselves.
  async enroll(req: Request, res: Response) {
    try {
      const actor = getActor(req);
      const { user_id, course_id } = req.body;
      if (!user_id || !course_id) return res.status(400).json({ error: 'user_id and course_id required' });

      if (!isTeacherOrAdmin(actor) && actor?.id !== user_id) {
        return res.status(403).json({ error: 'Only teachers/admins can enroll other users' });
      }

      const row = await enrollmentService.enroll(user_id, course_id);
      return res.status(201).json(row);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  // Unenroll
  async unenroll(req: Request, res: Response) {
    try {
      const actor = getActor(req);
      const { user_id, course_id } = req.body;
      if (!user_id || !course_id) return res.status(400).json({ error: 'user_id and course_id required' });

      if (!isTeacherOrAdmin(actor) && actor?.id !== user_id) {
        return res.status(403).json({ error: 'Only teachers/admins can unenroll other users' });
      }

      await enrollmentService.unenroll(user_id, course_id);
      return res.status(204).send();
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  },

  // Get all enrollments for a user (student sees own; teacher/admin can view any)
  async getUserEnrollments(req: Request, res: Response) {
    try {
      const actor = getActor(req);
      const user_id = req.params.user_id;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });

      if (!isTeacherOrAdmin(actor) && actor?.id !== user_id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const data = await enrollmentService.getUserEnrollments(user_id);
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Get all users enrolled in a course (teacher/admin only)
  async getCourseEnrollments(req: Request, res: Response) {
    try {
      const actor = getActor(req);
      const course_id = req.params.course_id;
      if (!isTeacherOrAdmin(actor)) return res.status(403).json({ error: 'Only teachers/admins can view course enrollments' });

      const data = await enrollmentService.getCourseEnrollments(course_id);
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Update progress (student can update own; teacher/admin any)
  async updateProgress(req: Request, res: Response) {
    try {
      const actor = getActor(req);
      const { user_id, course_id, progress } = req.body;
      if (!user_id || !course_id || progress == null) return res.status(400).json({ error: 'user_id, course_id, progress required' });

      if (!isTeacherOrAdmin(actor) && actor?.id !== user_id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const data = await enrollmentService.updateProgress(user_id, course_id, Number(progress));
      return res.json(data);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
};
