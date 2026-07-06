import type { Request, Response, NextFunction } from 'express';
import jwt = require('jsonwebtoken');
import authService = require('../services/auth.service');
import customErrors = require('../utils/customErrors');
import logger = require('../utils/logger');

const authMiddleware = {
  protectRoute: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new customErrors.AuthenticationError('No se proporcionó un token de acceso');
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        throw new customErrors.AuthenticationError('Formato de token inválido');
      }

      if (authService.isTokenRevoked(token)) {
        logger.warn(`Intento de uso de token revocado bloqueado. Token: ${token.substring(0, 10)}...`);
        throw new customErrors.AuthenticationError('Token revocado. Inicie sesión nuevamente.');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      (req as any).user = decoded;
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        logger.warn('Acceso denegado: El token ha vencido');
        next(new customErrors.AuthenticationError('Token vencido. Inicie sesión nuevamente.'));
      } else if (error instanceof customErrors.AuthenticationError) {
        next(error);
      } else {
        logger.warn('Acceso denegado: Token inválido o alterado');
        next(new customErrors.AuthenticationError('Token inválido o alterado.'));
      }
    }
  },

  requireRole: (requiredRole: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const user = (req as any).user;

        if (!user) {
          throw new customErrors.AuthenticationError('Usuario no autenticado.');
        }

        if (user.role !== requiredRole) {
          logger.warn(`Acceso denegado: Usuario [${user.email}] intentó acceder a una ruta exclusiva de [${requiredRole}]`);
          throw new customErrors.AuthorizationError('Acceso denegado: No posee los permisos necesarios para realizar esta acción.');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
};

export = authMiddleware;