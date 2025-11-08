import { Router } from 'express';
import { courseController } from '../controllers/courseController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

// public listing for smoke tests
router.get('/public', courseController.listPublic);
router.get('/', requireAuth, courseController.list);
router.get('/:id', requireAuth, courseController.get);
router.post('/', requireAuth, requireRole(['teacher', 'admin']), courseController.create);
router.put('/:id', requireAuth, courseController.update);
router.delete('/:id', requireAuth, courseController.delete);

export default router;
