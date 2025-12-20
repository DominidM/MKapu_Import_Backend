import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas (requieren token)
router.get('/profile', verifyToken, authController. getProfile);
router.post('/change-password', verifyToken, authController.changePassword);

export default router;