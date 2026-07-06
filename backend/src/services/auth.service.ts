import jwt = require('jsonwebtoken');
import db = require('../database/connection');
import logger = require('../utils/logger');

// Lista negra en memoria para invalidar tokens en el Logout (Punto 8)
const tokenBlacklist = new Set<string>();

const authService = {
  // 1. BUSCAR O CREAR USUARIO EN LA BASE DE DATOS
  authenticateGoogleUser: async (email: string, name: string) => {
    const [users]: any = await db.query('SELECT * FROM AppUsers WHERE Email = ?', [email]);
    let user;
    if (users.length > 0) {
      // El usuario existe, lo recuperamos
      user = users[0];
      logger.info(`Usuario de Google identificado en BD: ${user.Email} (Rol: ${user.Role})`);
    } else {
      //Si no existe se lo crea
      const [result]: any = await db.query(
        "INSERT INTO AppUsers (GoogleId, Email, Name, Role) VALUES (?, ?, ?, 'Customer')",
        [email, email, name]
      );
      const [newUsers]: any = await db.query('SELECT * FROM AppUsers WHERE UserId = ?', [result.insertId]);
      user = newUsers[0];
      logger.info(`Nuevo usuario registrado desde Google: ${user.Email} (Rol: ${user.Role})`);
    }
    return authService.generateToken({
      id: user.UserId,
      email: user.Email,
      name: user.Name,
      role: user.Role,
      customerId: user.Customer_ID
    });
  },

  generateToken: (user: { id: number; email: string; name: string; role: string; customerId: number | null }) => {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customerId
    };

    const options: jwt.SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '1h'
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, options);
  },

  invalidateToken: (token: string) => {
    tokenBlacklist.add(token);
  },
  isTokenRevoked: (token: string) => {
    return tokenBlacklist.has(token);
  }
};

export = authService;