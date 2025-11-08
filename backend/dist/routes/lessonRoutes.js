"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/lessonRoutes.ts
const express_1 = require("express");
const lessonController_1 = require("../controllers/lessonController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
// Public-ish: but requireAuth to know who requests for enrollment check
router.get('/course/:course_id', authMiddleware_1.requireAuth, lessonController_1.lessonController.listByCourse);
router.get('/:id', authMiddleware_1.requireAuth, lessonController_1.lessonController.getById);
// Teacher/Admin only operations
router.post('/', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)(['teacher', 'admin']), lessonController_1.lessonController.create);
router.put('/:id', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)(['teacher', 'admin']), lessonController_1.lessonController.update);
router.delete('/:id', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)(['teacher', 'admin']), lessonController_1.lessonController.delete);
router.put('/:id/publish', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)(['teacher', 'admin']), lessonController_1.lessonController.setPublish);
exports.default = router;
//# sourceMappingURL=lessonRoutes.js.map