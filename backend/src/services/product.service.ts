import productRepository = require('../repositories/product.repository');
import customErrors = require('../utils/customErrors');
import logger = require('../utils/logger');
import db = require('../database/connection');

const productService = {
  getAll: () => productRepository.findAll(),
  getById: (id: number) => productRepository.findById(id),
  createProduct: async (data: any) => {
    if (data.unitPrice <= 0) {
      throw new customErrors.ValidationError('🚨 El precio debe ser mayor a 0.');
    }
    if (data.unitsInStock < 0) {
      throw new customErrors.ValidationError('🚨 El stock no puede ser un número negativo.');
    }
    return await productRepository.create(data);
  },

  updateProduct: async (id: number, data: any) => {
    if (data.unitPrice <= 0) {
      throw new customErrors.ValidationError('🚨 El precio debe ser mayor a 0.');
    }
    if (data.unitsInStock < 0) {
      throw new customErrors.ValidationError('🚨 El stock no puede ser un número negativo.');
    }
    return await productRepository.update(id, data);
  },

  deleteProduct: (id: number) => productRepository.delete(id),

  processPurchase: async (productId: number, quantity: number, userId: string, customerId: number) => {
    logger.info(`Usuario [${userId}] intentando comprar ${quantity} unidades del producto ID [${productId}]`);

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new customErrors.ValidationError('La cantidad a comprar debe ser un número entero mayor a 0.');
    }

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      const [products]: any = await connection.query(
        'SELECT list_price AS UnitPrice, target_level AS UnitsInStock, discontinued FROM products WHERE id = ? FOR UPDATE',
        [productId]
      );
      if (products.length === 0) {
        throw new customErrors.ValidationError('El producto solicitado no existe.');
      }
      const product = products[0];
      if (product.discontinued === 1) {
        throw new customErrors.ValidationError('El producto seleccionado ya no está disponible en el catálogo.');
      }

      if (product.UnitsInStock < quantity) {
        throw new customErrors.StockError(`Stock insuficiente. Stock actual: ${product.UnitsInStock}`);
      }

      const [orderResult]: any = await connection.query(
        'INSERT INTO orders (customer_id, order_date) VALUES (?, NOW())',
        [customerId]
      );
      const orderId = orderResult.insertId;

      await connection.query(
        'INSERT INTO order_details (order_id, product_id, unit_price, quantity, discount) VALUES (?, ?, ?, ?, 0)',
        [orderId, productId, product.UnitPrice, quantity]
      );

      const newStock = product.UnitsInStock - quantity;

      await connection.query(
        'UPDATE products SET target_level = ? WHERE id = ?',
        [newStock, productId]
      );

      await connection.commit();

      logger.info(`Compra exitosa del producto [${productId}]. Nuevo Stock: ${newStock}. Orden Generada: ${orderId}`);
      return {
        message: 'Compra procesada con éxito',
        orderId,
        productId,
        quantity,
        remainingStock: newStock
      };

    } catch (error) {
      await connection.rollback();
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error en la transacción de compra: ${errorMessage}`);
      throw error;
    } finally {
      connection.release();
    }
  }
};

export = productService;