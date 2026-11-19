import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

type ValidationSource = 'body' | 'params' | 'query';

export const validate = (
  schema: Joi.ObjectSchema,
  source: ValidationSource = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type,
      }));
      const message = details.map((d) => d.message).join(', ');
      throw new ValidationError(message, details);
    }

    if (source === 'query') {
      const target = (req as any).query;
      if (target && typeof target === 'object') {
        for (const key of Object.keys(target)) {
          delete target[key];
        }
        Object.assign(target, value);
      } else {
        Object.defineProperty(req, 'query', {
          value,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
    } else {
      (req as any)[source] = value;
    }

    next();
  };
};