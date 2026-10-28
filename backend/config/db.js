const { Pool } = require('pg');

// Prioritas: DATABASE_URL (cocok untuk Amazon RDS), fallback ke variabel terpisah
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'hris_db'
    });

pool.on('error', (err) => console.error('Kesalahan koneksi pool PostgreSQL:', err));

module.exports = pool;
