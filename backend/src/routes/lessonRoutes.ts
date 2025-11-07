// src/routes/lessonRoutes.ts
import { Router } from 'express';
import { lessonController } from '../controllers/lessonController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

// Public-ish: but requireAuth to know who requests for enrollment check
router.get('/course/:course_id', requireAuth, lessonController.listByCourse);
router.get('/:id', requireAuth, lessonController.getById);

// Teacher/Admin only operations
router.post('/', requireAuth, requireRole(['teacher','admin']), lessonController.create);
router.put('/:id', requireAuth, requireRole(['teacher','admin']), lessonController.update);
router.delete('/:id', requireAuth, requireRole(['teacher','admin']), lessonController.delete);
router.put('/:id/publish', requireAuth, requireRole(['teacher','admin']), lessonController.setPublish);

export default router;
