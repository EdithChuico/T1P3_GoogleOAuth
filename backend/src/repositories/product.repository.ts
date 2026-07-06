import db = require('../database/connection');

const productRepository = {
  findAll: async () => {
    const [rows] = await db.query(
      'SELECT id, product_code AS productCode, product_name AS productName, list_price AS unitPrice, target_level AS unitsInStock, category FROM products WHERE discontinued = 0'
    );
    return rows;
  },

  findById: async (id: number) => {
    const [rows]: any = await db.query(
      'SELECT id, product_code AS productCode, product_name AS productName, list_price AS unitPrice, target_level AS unitsInStock, category FROM products WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  create: async (product: any) => {
    const { productName, unitPrice, unitsInStock, productCode, category } = product;
    const [result]: any = await db.query(
      'INSERT INTO products (product_name, list_price, target_level, product_code, category, discontinued) VALUES (?, ?, ?, ?, ?, 0)',
      [productName, unitPrice, unitsInStock, productCode || 'NW-NEW', category || 'General']
    );
    return { id: result.insertId, ...product };
  },
  update: async (id: number, data: any) => {
    const { productName, unitPrice, unitsInStock } = data;
    await db.query(
      'UPDATE products SET product_name = ?, list_price = ?, target_level = ? WHERE id = ?',
      [productName, unitPrice, unitsInStock, id]
    );
    return await productRepository.findById(id);
  },

  delete: async (id: number) => {
    const [result]: any = await db.query(
      'UPDATE products SET discontinued = 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};

export = productRepository;