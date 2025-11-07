// src/routes/enrollmentRoutes.ts
import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { enrollmentController } from '../controllers/enrollmentController';

const router = Router();

// Enroll / Unenroll
router.post('/', requireAuth, enrollmentController.enroll);
router.delete('/', requireAuth, enrollmentController.unenroll);

// List user enrollments (self or teacher/admin)
router.get('/user/:user_id', requireAuth, enrollmentController.getUserEnrollments);

// List course enrollments (teacher/admin)
router.get('/course/:course_id', requireAuth, requireRole(['teacher','admin']), enrollmentController.getCourseEnrollments);

// Update progress
router.put('/progress', requireAuth, enrollmentController.updateProgress);

export default router;
