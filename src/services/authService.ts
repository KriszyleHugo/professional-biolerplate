import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { UnauthorizedError } from '../utils/errors';
import { config } from '../config/env';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthService');

interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

export class AuthService {
  private static getUserRepository() {
    return AppDataSource.getRepository(User);
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;
    const userRepository = this.getUserRepository();

    const user = await userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        isActive: true,
      },
    });

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      logger.warn('Login attempt for inactive account', { email });
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Login attempt with wrong password', { email });
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const signOptions: SignOptions = {
      expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, signOptions);

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  static async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      const err = error as Error;
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      }
      if (err.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Authentication failed');
    }
  }

  static async getUserFromToken(token: string): Promise<User> {
    const decoded = await this.verifyToken(token);
    const userRepository = this.getUserRepository();

    const user = await userRepository.findOne({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    return user;
  }
}