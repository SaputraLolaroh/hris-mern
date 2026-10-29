require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// CORS: izinkan frontend lokal dan domain yang dikonfigurasi.
// Pada deployment Vercel, frontend dan API memakai domain yang sama.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Request server-to-server atau same-origin tanpa Origin tetap diizinkan.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin tidak diizinkan oleh kebijakan CORS.'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Semua endpoint API
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.status(200).json({ success: true, message: 'Server OK' }));

// Error handler global
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error tidak tertangani:', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
});

// Vercel memerlukan Express app diekspor; listen hanya untuk penggunaan lokal.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server Express.js berjalan di http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

module.exports = app;
