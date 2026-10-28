const express = require('express');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// GET /api/dashboard/stats - Statistik kartu dashboard (real-time dari database)
router.get('/stats', async (req, res) => {
  try {
    const totalEmployees = parseInt(
      (await pool.query("SELECT COUNT(*) FROM employees WHERE status = 'active'")).rows[0].count, 10
    );

    const today = new Date().toISOString().split('T')[0];
    const presentToday = parseInt(
      (await pool.query(
        "SELECT COUNT(*) FROM attendances WHERE date = $1 AND status IN ('present','late')", [today]
      )).rows[0].count, 10
    );

    const pendingLeave = parseInt(
      (await pool.query("SELECT COUNT(*) FROM leaves WHERE status = 'pending'")).rows[0].count, 10
    );

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const payrollSum = await pool.query(
      'SELECT SUM(net_salary) AS total FROM payrolls WHERE period_month = $1 AND period_year = $2',
      [currentMonth, currentYear]
    );
    const totalPayroll = payrollSum.rows[0].total || 0;

    res.status(200).json({
      success: true,
      data: {
        total_employees: `${totalEmployees} Orang`,
        present_today: `${presentToday} Hadir`,
        pending_leave: `${pendingLeave} Permohonan`,
        total_payroll: `Rp ${Number(totalPayroll).toLocaleString('id-ID')}`
      }
    });
  } catch (error) {
    console.error('Error mengambil statistik dashboard:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat statistik server.' });
  }
});

module.exports = router;
