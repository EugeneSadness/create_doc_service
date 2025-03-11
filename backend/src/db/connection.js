const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function connectDB() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    client.release();
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  connectDB,
  query: (text, params) => pool.query(text, params),
}; 