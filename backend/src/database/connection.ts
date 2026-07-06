import mysql = require('mysql2/promise');
import dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER || 'edith12345',
    password: process.env.DB_PASSWORD || 'edith12345',
    database: process.env.DB_NAME || 'northwind',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export = pool;