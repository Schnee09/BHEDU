import { Router } from 'express';
import { userController } from '../controllers/userController';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';

const router = Router();

// self profile
router.get('/me', requireAuth, userController.me);
router.put('/:id', requireAuth, userController.update);
router.delete('/:id', requireAuth, requireRole(['admin']), userController.delete);

// teacher/admin only
router.get('/', requireAuth, requireRole(['admin', 'teacher']), userController.list);
router.get('/:id', requireAuth, requireRole(['admin', 'teacher']), userController.get);

export default router;
