import { Request, Response, NextFunction, RequestHandler } from 'express';
import { jwtService } from '../../domains/auth/jwt.service.js';
import { AppError } from '../../shared/errors/AppError.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const authMiddleware: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Authentication token missing', 401));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwtService.verifyAccessToken(token);
    (req as AuthenticatedRequest).user = { id: decoded.sub };
    next();
  } catch (err) {
    next(err);
  }
};
