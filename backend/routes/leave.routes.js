const express = require('express');
const pool = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// POST /api/leaves/apply - Karyawan mengajukan cuti (status awal: pending)
router.post('/apply', async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { leave_type, start_date, end_date, reason } = req.body;

    if (!leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi.' });
    }

    const result = await pool.query(
      `INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status)
       VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
      [employeeId, leave_type, start_date, end_date, reason]
    );
    res.status(201).json({
      success: true,
      message: 'Pengajuan cuti berhasil dikirim dan menunggu persetujuan HR.',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saat mengajukan cuti:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/leaves/requests - Daftar permohonan cuti (HR_ADMIN saja)
router.get('/requests', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id AS leave_id, e.nik,
              CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
              d.name AS department_name, l.leave_type, l.start_date, l.end_date,
              l.reason, l.status, l.created_at
       FROM leaves l
       INNER JOIN employees e ON l.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ORDER BY l.created_at DESC`
    );
    res.status(200).json({ success: true, total: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('Error mengambil daftar cuti:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat data permohonan cuti.' });
  }
});

// GET /api/leaves/my - Riwayat cuti milik karyawan yang login
router.get('/my', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM leaves WHERE employee_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error mengambil riwayat cuti:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat riwayat cuti.' });
  }
});

// PUT /api/leaves/approve/:id - Persetujuan / penolakan HR (HR_ADMIN saja)
router.put('/approve/:id', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { status } = req.body; // 'approved' atau 'rejected'
    const hrId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status persetujuan tidak valid.' });
    }

    const result = await pool.query(
      'UPDATE leaves SET status = $1, approved_by = $2 WHERE id = $3 RETURNING *',
      [status, hrId, leaveId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data pengajuan cuti tidak ditemukan.' });
    }
    res.status(200).json({
      success: true,
      message: `Pengajuan cuti berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saat proses approval cuti:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
