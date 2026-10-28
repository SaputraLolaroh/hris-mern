require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// CORS: hanya izinkan origin frontend yang terdaftar
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Express.js berjalan di http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
});
