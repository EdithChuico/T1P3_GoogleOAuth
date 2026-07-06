import express = require('express');
import dotenv = require('dotenv');
import cors = require('cors');
dotenv.config();
import authMiddleware = require('./middlewares/auth.middleware');
import errorHandler = require('./middlewares/errorHandler');
import authService = require('./services/auth.service');
import productController = require('./controllers/product.controller');
import orderRepository = require('./repositories/order.repository');
import logger = require('./utils/logger');
const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.post('/api/auth/google/callback', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Falta el email o nombre del perfil de Google' });
    }

    const token = await authService.authenticateGoogleUser(email, name);
    logger.info(`Inicio de sesión exitoso con Google: ${email}`);

    res.json({ message: 'Autenticación exitosa', token: `Bearer ${token}` });
  } catch (e) { next(e); }
});

app.post('/api/auth/logout', authMiddleware.protectRoute, (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Formato de token inválido' });
      return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'Token no encontrado en la cabecera' });
      return;
    }
    authService.invalidateToken(token);
    logger.info(`Cierre de sesión exitoso para el usuario: ${(req as any).user.email}`);
    res.json({ message: 'Sesión cerrada e invalidada correctamente' });
  } catch (e) { next(e); }
});

app.get('/api/orders', authMiddleware.protectRoute, async (req, res, next) => {
  try {
    const user = (req as any).user;
    if (user.role === 'Admin') {
      const orders = await orderRepository.findAll();
      res.json(orders);
    } else {
      const orders = await orderRepository.findByCustomerId(user.id);
      res.json(orders);
    }
  } catch (e) { next(e); }
});

app.get('/api/orders/:id/details', authMiddleware.protectRoute, async (req, res, next) => {
  try {
    const { id } = req.params;
    const details = await orderRepository.findDetailsByOrderId(Number(id));
    res.json(details);
  } catch (e) { next(e); }
});
app.get('/api/products', authMiddleware.protectRoute, productController.getAll);
app.post('/api/products', authMiddleware.protectRoute, authMiddleware.requireRole('Admin'), productController.create);
app.put('/api/products/:id', authMiddleware.protectRoute, authMiddleware.requireRole('Admin'), productController.update);
app.delete('/api/products/:id', authMiddleware.protectRoute, authMiddleware.requireRole('Admin'), productController.delete);
app.post('/api/products/buy', authMiddleware.protectRoute, authMiddleware.requireRole('Customer'), productController.buy);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Servidor distribuido corriendo en http://localhost:${PORT}`);
});