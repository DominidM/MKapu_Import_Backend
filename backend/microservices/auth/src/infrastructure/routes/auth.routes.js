import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verifyToken } from '../../../../../shared/infrastructure/middlewares/auth.middleware.js';
import { checkRole } from '../../../../../shared/infrastructure/middlewares/auth.middleware.js';

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);

router.get('/profile', verifyToken, checkRole("Jefe_almacen","Administracion","Caja"), authController.getProfile);
router.post('/change-password', verifyToken, checkRole("Jefe_almacen","Administracion","Caja"), authController.changePassword);
export default router; 