import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { EmailService } from './emailService';
import {
  AppError,
  BadRequestError as ImportedBadRequestError,
  ConflictError as ImportedConflictError,
} from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('VerificationService');

function badRequest(message: string): Error {
  if (typeof ImportedBadRequestError === 'function') {
    return new ImportedBadRequestError(message);
  }
  return new AppError(message, 400, 'BAD_REQUEST');
}

function conflict(message: string): Error {
  if (typeof ImportedConflictError === 'function') {
    return new ImportedConflictError(message);
  }
  return new AppError(message, 409, 'CONFLICT');
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  age?: number;
}

export class VerificationService {
  private static getUserRepository() {
    return AppDataSource.getRepository(User);
  }

  static async register(input: RegisterInput) {
    const { name, email, password, age } = input;
    const userRepository = this.getUserRepository();

    const existing = await userRepository.findOne({ where: { email } });
    if (existing) {
      throw conflict('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = userRepository.create({
      name,
      email,
      password: hashedPassword,
      age: age ?? null,
      isVerified: false,
      verificationToken,
      verificationTokenExpiry,
    });

    await userRepository.save(user);

    try {
      await EmailService.sendVerificationEmail(email, verificationToken);
      logger.info('Verification email sent', { email, userId: user.id });
    } catch (error) {
      logger.error('Failed to send verification email', { email, error });
    }

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  static async verifyEmail(token: string) {
    const userRepository = this.getUserRepository();

    const user = await userRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw badRequest('Invalid verification token');
    }

    if (user.isVerified) {
      throw badRequest('Email already verified');
    }

    if (!user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
      throw badRequest('Verification token has expired. Please request a new one.');
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await userRepository.save(user);

    logger.info('Email verified successfully', { userId: user.id, email: user.email });
    return { message: 'Email verified successfully. You can now log in.' };
  }

  static async resendVerification(email: string) {
    const userRepository = this.getUserRepository();

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return {
        message: 'If an account with that email exists, a verification email has been sent.',
      };
    }

    if (user.isVerified) {
      return { message: 'Email already verified. You can log in.' };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await userRepository.save(user);

    try {
      await EmailService.sendVerificationEmail(email, verificationToken);
      logger.info('Verification email resent', { email, userId: user.id });
    } catch (error) {
      logger.error('Failed to resend verification email', { email, error });
    }

    return {
      message: 'If an account with that email exists, a verification email has been sent.',
    };
  }

  static async forgotPassword(email: string) {
    const userRepository = this.getUserRepository();

    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      logger.warn('Password reset requested for non-existent email', { email });
      return {
        message: 'If an account with that email exists, a reset link has been sent.',
      };
    }

    if (!user.isVerified) {
      logger.warn('Password reset requested for unverified account', { email });
      return {
        message: 'If an account with that email exists, a reset link has been sent.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await userRepository.save(user);

    try {
      await EmailService.sendPasswordResetEmail(email, resetToken);
      logger.info('Password reset email sent', { email, userId: user.id });
    } catch (error) {
      logger.error('Failed to send password reset email', { email, error });
    }

    return {
      message: 'If an account with that email exists, a reset link has been sent.',
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    const userRepository = this.getUserRepository();

    const user = await userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      throw badRequest('Invalid reset token');
    }

    if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
      throw badRequest('Reset token has expired. Please request a new one.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await userRepository.save(user);

    logger.info('Password reset successfully', { userId: user.id, email: user.email });
    return {
      message: 'Password reset successfully. You can now log in with your new password.',
    };
  }
}