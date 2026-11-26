import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_DATABASE: Joi.string().required(),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:4200'),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().required(),
}).unknown();

const { value: env, error } = envSchema
  .prefs({ errors: { label: 'key' } })
  .validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

export const config = {
  env: env.NODE_ENV as string,
  isDev: env.NODE_ENV === 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: Number(env.PORT),
  db: {
    host: env.DB_HOST as string,
    port: Number(env.DB_PORT),
    username: env.DB_USERNAME as string,
    password: env.DB_PASSWORD as string,
    database: env.DB_DATABASE as string,
  },
  frontendUrl: env.FRONTEND_URL as string,
  jwt: {
    secret: env.JWT_SECRET as string,
    expiresIn: env.JWT_EXPIRES_IN as string,
  },
  email: {
    host: env.SMTP_HOST as string,
    port: Number(env.SMTP_PORT),
    user: env.SMTP_USER as string,
    pass: env.SMTP_PASS as string,
    from: env.EMAIL_FROM as string,
  },
};