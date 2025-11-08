"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/enrollmentRoutes.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const enrollmentController_1 = require("../controllers/enrollmentController");
const router = (0, express_1.Router)();
// Enroll / Unenroll
router.post('/', authMiddleware_1.requireAuth, enrollmentController_1.enrollmentController.enroll);
router.delete('/', authMiddleware_1.requireAuth, enrollmentController_1.enrollmentController.unenroll);
// List user enrollments (self or teacher/admin)
router.get('/user/:user_id', authMiddleware_1.requireAuth, enrollmentController_1.enrollmentController.getUserEnrollments);
// List course enrollments (teacher/admin)
router.get('/course/:course_id', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)(['teacher', 'admin']), enrollmentController_1.enrollmentController.getCourseEnrollments);
// Update progress
router.put('/progress', authMiddleware_1.requireAuth, enrollmentController_1.enrollmentController.updateProgress);
exports.default = router;
//# sourceMappingURL=enrollmentRoutes.js.map