// src/routes/internalRoutes.ts
import { Router } from 'express';
import { requireHMAC } from '../middlewares/hmacMiddleware';
import { courseController } from '../controllers/courseController';
import { lessonController } from '../controllers/lessonController';
import { userController } from '../controllers/userController';

/**
 * Internal HMAC-protected routes for server-to-server communication.
 * These mirror the Next.js API routes and allow the Express backend
 * to be called securely from other services.
 */
const router = Router();

// Users (profiles) - HMAC protected for internal use
router.get('/users', requireHMAC, userController.list);
router.post('/users', requireHMAC, userController.create);

// Courses - HMAC protected for internal use
router.get('/courses', requireHMAC, courseController.list);
router.post('/courses', requireHMAC, courseController.create);
router.put('/courses/:id', requireHMAC, courseController.update);
router.delete('/courses/:id', requireHMAC, courseController.delete);

// Lessons - HMAC protected for internal use
router.get('/lessons', requireHMAC, lessonController.listByCourseInternal);
router.post('/lessons', requireHMAC, lessonController.create);
router.put('/lessons/:id', requireHMAC, lessonController.update);
router.delete('/lessons/:id', requireHMAC, lessonController.delete);

export default router;
