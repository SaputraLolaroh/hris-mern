const express = require('express');
const pool = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');
const { calculateDistance } = require('../utils/geo');
const { buildAttendanceWorkbook } = require('../services/excel.service');

const router = express.Router();
router.use(verifyToken);

// POST /api/attendances/clock - Check-in (wajib GPS) / check-out
router.post('/clock', async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { type, latitude, longitude } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    if (type === 'check-in') {
      // 1. Validasi keberadaan GPS
      if (!latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'Koordinat GPS tidak terdeteksi. Harap aktifkan izin lokasi.' });
      }

      // 2. Validasi radius kantor (Haversine)
      const officeLat = parseFloat(process.env.OFFICE_LAT);
      const officeLon = parseFloat(process.env.OFFICE_LON);
      const maxRadius = parseInt(process.env.MAX_RADIUS_METERS || '100', 10);

      if (!isNaN(officeLat) && !isNaN(officeLon)) {
        const distance = calculateDistance(officeLat, officeLon, latitude, longitude);
        if (distance > maxRadius) {
          return res.status(400).json({
            success: false,
            message: `Gagal Check-In! Anda berada di luar radius kantor (${Math.round(distance)} meter).`
          });
        }
      }

      // 3. Cek duplikasi check-in hari ini
      const checkExist = await pool.query(
        'SELECT * FROM attendances WHERE employee_id = $1 AND date = $2',
        [employeeId, today]
      );
      if (checkExist.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Anda sudah melakukan check-in hari ini.' });
      }

      // 4. Simpan check-in
      await pool.query(
        "INSERT INTO attendances (employee_id, date, clock_in, status) VALUES ($1,$2,$3,'present')",
        [employeeId, today, currentTime]
      );
      return res.status(200).json({ success: true, message: 'Berhasil Check-In di area kantor!' });
    }

    if (type === 'check-out') {
      const updateResult = await pool.query(
        'UPDATE attendances SET clock_out = $1 WHERE employee_id = $2 AND date = $3 RETURNING *',
        [currentTime, employeeId, today]
      );
      if (updateResult.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Anda belum melakukan check-in hari ini.' });
      }
      return res.status(200).json({ success: true, message: 'Berhasil Check-Out! Hati-hati di jalan.' });
    }

    res.status(400).json({ success: false, message: 'Tipe absensi tidak valid.' });
  } catch (error) {
    console.error('Error saat proses absensi:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

// GET /api/attendances/chart-stats - Data rekap 7 hari terakhir untuk Chart.js
router.get('/chart-stats', async (req, res) => {
  try {
    const query = `
      SELECT TO_CHAR(date, 'Day') AS day_name,
             SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
             SUM(CASE WHEN status = 'late'    THEN 1 ELSE 0 END) AS late_count,
             SUM(CASE WHEN status IN ('permission','sick') THEN 1 ELSE 0 END) AS leave_count
      FROM attendances
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY date, day_name
      ORDER BY date ASC`;
    const result = await pool.query(query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error mengambil statistik chart:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat data grafik.' });
  }
});

// GET /api/attendances/export-excel - Ekspor rekap absensi (.xlsx, HR_ADMIN saja)
router.get('/export-excel', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.nik, CONCAT(e.first_name, ' ', e.last_name) AS full_name,
              d.name AS department_name, a.date, a.clock_in, a.clock_out, a.status, a.overtime_hours
       FROM attendances a
       INNER JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ORDER BY a.date DESC, e.first_name ASC`
    );
    const workbook = await buildAttendanceWorkbook(result.rows);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Rekap_Absensi_${new Date().toISOString().split('T')[0]}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Gagal mengekspor file Excel:', error);
    res.status(500).json({ success: false, message: 'Gagal menghasilkan file Excel.' });
  }
});

module.exports = router;
