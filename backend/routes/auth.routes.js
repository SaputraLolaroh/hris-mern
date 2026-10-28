const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login - Login karyawan/HR, menerbitkan JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const result = await pool.query('SELECT * FROM employees WHERE email = $1', [email]);
    const user = result.rows[0];

    // Bcrypt compare; pesan error dibuat generik agar tidak membocorkan keberadaan akun
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Akun Anda tidak aktif. Hubungi HR.' });
    }

    const payload = {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role
    };
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '2h'
    });

    res.status(200).json({ success: true, message: 'Login berhasil!', token });
  } catch (error) {
    console.error('Error saat login:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// POST /api/auth/logout - (stateless JWT) endpoint kehadiran untuk logging/audit & hapus cookie jika dipakai
router.post('/logout', verifyToken, (req, res) => {
  console.log(`User ${req.user.name} (id: ${req.user.id}) logout pada ${new Date().toISOString()}`);
  res.status(200).json({ success: true, message: 'Logout berhasil.' });
});

// GET /api/auth/me - Data profil pengguna yang sedang login
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.nik, e.first_name, e.last_name, e.email, e.position,
              e.role, e.status, d.name AS department_name
       FROM employees e LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = $1`,
      [req.user.id]
    );
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error saat ambil profil:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
