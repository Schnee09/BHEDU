"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const courseController_1 = require("../controllers/courseController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
// public listing for smoke tests
router.get('/public', courseController_1.courseController.listPublic);
router.get('/', authMiddleware_1.requireAuth, courseController_1.courseController.list);
router.get('/:id', authMiddleware_1.requireAuth, courseController_1.courseController.get);
router.post('/', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)(['teacher', 'admin']), courseController_1.courseController.create);
router.put('/:id', authMiddleware_1.requireAuth, courseController_1.courseController.update);
router.delete('/:id', authMiddleware_1.requireAuth, courseController_1.courseController.delete);
exports.default = router;
//# sourceMappingURL=courseRoutes.js.map