import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { loginSchema } from '../dto/auth.dto';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/auth';
import { verificationRoutes } from './verificationRoutes';

export const authRoutes = Router();

authRoutes.use('/', verificationRoutes);

authRoutes.post(
  '/login',
  validate(loginSchema),
  asyncHandler(AuthController.login)
);

authRoutes.get(
  '/me',
  authMiddleware,
  asyncHandler(AuthController.getMe)
);