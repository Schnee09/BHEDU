"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
// self profile
router.get('/me', authMiddleware_1.requireAuth, userController_1.userController.me);
router.put('/:id', authMiddleware_1.requireAuth, userController_1.userController.update);
router.delete('/:id', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)(['admin']), userController_1.userController.delete);
// teacher/admin only
router.get('/', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)(['admin', 'teacher']), userController_1.userController.list);
router.get('/:id', authMiddleware_1.requireAuth, (0, roleMiddleware_1.requireRole)(['admin', 'teacher']), userController_1.userController.get);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map