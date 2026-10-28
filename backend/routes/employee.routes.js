const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/employees - Ambil semua data karyawan (HR_ADMIN saja)
router.get('/', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, d.name AS department_name
       FROM employees e LEFT JOIN departments d ON e.department_id = d.id
       ORDER BY e.created_at DESC`
    );
    // Jangan pernah kembalikan hash password
    result.rows.forEach((r) => delete r.password);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error mengambil data karyawan:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data karyawan.' });
  }
});

// POST /api/employees - Tambah karyawan baru (HR_ADMIN saja)
router.post('/', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const {
      nik, first_name, last_name, email, password,
      phone_number, department_id, position, base_salary,
      bank_name, bank_account, join_date, role
    } = req.body;

    if (!nik || !first_name || !last_name || !email || !password || !position || !join_date) {
      return res.status(400).json({ success: false, message: 'Data wajib belum lengkap.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO employees (nik, first_name, last_name, email, password, phone_number,
        department_id, position, base_salary, bank_name, bank_account, join_date, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [nik, first_name, last_name, email, hashedPassword, phone_number || null,
       department_id || null, position, base_salary || 0, bank_name || null,
       bank_account || null, join_date, role || 'EMPLOYEE']
    );
    delete result.rows[0].password;
    res.status(201).json({ success: true, message: 'Karyawan berhasil ditambahkan.', data: result.rows[0] });
  } catch (error) {
    console.error('Error menambah karyawan:', error);
    // Pelanggaran UNIQUE constraint (NIK/email duplikat) menghasilkan error code 23505
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'NIK atau email sudah terdaftar.' });
    }
    res.status(500).json({ success: false, message: 'Gagal menambah karyawan.' });
  }
});

// PUT /api/employees/:id - Perbarui data karyawan (HR_ADMIN saja)
router.put('/:id', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, phone_number, department_id,
      position, base_salary, bank_name, bank_account, status
    } = req.body;

    const result = await pool.query(
      `UPDATE employees
       SET first_name=$1, last_name=$2, phone_number=$3, department_id=$4, position=$5,
           base_salary=$6, bank_name=$7, bank_account=$8, status=$9
       WHERE id=$10 RETURNING *`,
      [first_name, last_name, phone_number, department_id, position,
       base_salary, bank_name, bank_account, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Karyawan tidak ditemukan.' });
    }
    delete result.rows[0].password;
    res.status(200).json({ success: true, message: 'Data karyawan berhasil diperbarui.', data: result.rows[0] });
  } catch (error) {
    console.error('Error memperbarui karyawan:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data karyawan.' });
  }
});

// DELETE /api/employees/:id - Hapus karyawan (HR_ADMIN saja; ON DELETE CASCADE ikut menghapus absensi/payroll)
router.delete('/:id', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    res.status(200).json({ success: true, message: 'Karyawan berhasil dihapus.' });
  } catch (error) {
    console.error('Error menghapus karyawan:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus karyawan.' });
  }
});

module.exports = router;
