import db = require('../database/connection');

const orderRepository = {
    findAll: async () => {
        const [rows] = await db.query(
            'SELECT id, customer_id AS customerId, order_date AS orderDate FROM orders ORDER BY order_date DESC'
        );
        return rows;
    },

    findByCustomerId: async (customerId: number) => {
        const [rows] = await db.query(
            'SELECT id, customer_id AS customerId, order_date AS orderDate FROM orders WHERE customer_id = ? ORDER BY order_date DESC',
            [customerId]
        );
        return rows;
    },

    findDetailsByOrderId: async (orderId: number) => {
        const [rows] = await db.query(
            `SELECT od.id, od.order_id AS orderId, od.product_id AS productId, 
                p.product_name AS productName, od.unit_price AS unitPrice, od.quantity 
            FROM order_details od 
            JOIN products p ON od.product_id = p.id 
            WHERE od.order_id = ?`,
            [orderId]
        );
        return rows;
    }
};

export = orderRepository;