// src/routes/authRoutes.ts
import { Router } from 'express';
import { authController } from '../controllers/authController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', authController.register); // server-side register (admin)
router.post('/login', authController.login);       // server-side login (proxy)
router.get('/profile', requireAuth, authController.profile);

export default router;
