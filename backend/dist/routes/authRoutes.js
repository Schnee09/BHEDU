"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/authRoutes.ts
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/register', authController_1.authController.register); // server-side register (admin)
router.post('/login', authController_1.authController.login); // server-side login (proxy)
router.get('/profile', authMiddleware_1.requireAuth, authController_1.authController.profile);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map