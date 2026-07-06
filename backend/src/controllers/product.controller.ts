import type { Request, Response, NextFunction } from 'express';
import productService = require('../services/product.service');
import logger = require('../utils/logger');
import customErrors = require('../utils/customErrors');

const productController = {
  getAll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await productService.getAll();
      res.json(data);
    } catch (e) { next(e); }
  },

  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const newProd = await productService.createProduct(req.body);
      logger.info(`CRUD Admin: Producto creado con ID [${newProd.id}]`);
      res.status(201).json(newProd);
    } catch (e) { next(e); }
  },
  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedProd = await productService.updateProduct(Number(id), req.body);
      logger.info(`CRUD Admin: Producto actualizado con ID [${id}]`);
      res.json(updatedProd);
    } catch (e) { next(e); }
  },
  delete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await productService.deleteProduct(Number(id));
      logger.info(`CRUD Admin: Producto eliminado con ID [${id}]`);
      res.status(204).send(); // 204 No Content es el estándar para deletes exitosos
    } catch (e) { next(e); }
  },
  buy: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId, quantity } = req.body;
      const user = (req as any).user;

      if (productId === undefined || quantity === undefined) {
        throw new customErrors.ValidationError('Campos incompletos: productId y quantity son obligatorios.');
      }

      const qty = Number(quantity);
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        throw new customErrors.ValidationError('Cantidad incorrecta. Debe ser un número entero mayor a cero.');
      }
      const result = await productService.processPurchase(
        Number(productId),
        qty,
        user.email,
        user.id
      );

      res.json(result);
    } catch (e) {
      next(e);
    }
  }
};

export = productController;