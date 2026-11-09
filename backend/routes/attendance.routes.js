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
    const { type, latitude, longitude, accuracy } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];

    if (type === 'check-in') {
      if (latitude == null || longitude == null || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
        return res.status(400).json({ success: false, message: 'Koordinat GPS tidak terdeteksi. Harap aktifkan izin lokasi.' });
      }

      const officeLat = parseFloat(process.env.OFFICE_LAT);
      const officeLon = parseFloat(process.env.OFFICE_LON);
      const maxRadius = parseInt(process.env.MAX_RADIUS_METERS || '100', 10);
      let distance = null;

      if (Number.isFinite(officeLat) && Number.isFinite(officeLon)) {
        distance = calculateDistance(officeLat, officeLon, Number(latitude), Number(longitude));
        if (distance > maxRadius) {
          return res.status(400).json({
            success: false,
            message: `Gagal Check-In! Anda berada di luar radius kantor (${Math.round(distance)} meter).`
          });
        }
      }

      const checkExist = await pool.query(
        'SELECT * FROM attendances WHERE employee_id = $1 AND date = $2',
        [employeeId, today]
      );
      if (checkExist.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Anda sudah melakukan check-in hari ini.' });
      }

      await pool.query(
        `INSERT INTO attendances
          (employee_id, date, clock_in, status, checkin_latitude, checkin_longitude, checkin_accuracy_meters)
         VALUES ($1, $2, $3, 'present', $4, $5, $6)`,
        [employeeId, today, currentTime, Number(latitude), Number(longitude),
          Number.isFinite(Number(accuracy)) ? Number(accuracy) : null]
      );
      return res.status(200).json({ success: true, message: 'Berhasil Check-In di area kantor!', distance_meters: distance });
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

// GET /api/attendances - Daftar absensi dan ringkasan untuk HR_ADMIN.
router.get('/', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const {
      startDate, endDate, search = '', departmentId = '', status = '',
      page = '1', limit = '25'
    } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const values = [];
    const conditions = [];

    if (startDate) {
      values.push(startDate);
      conditions.push(`a.date >= $${values.length}::date`);
    }
    if (endDate) {
      values.push(endDate);
      conditions.push(`a.date <= $${values.length}::date`);
    }
    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(e.first_name ILIKE $${values.length} OR e.last_name ILIKE $${values.length} OR e.nik ILIKE $${values.length} OR CONCAT(e.first_name, ' ', e.last_name) ILIKE $${values.length})`);
    }
    if (departmentId) {
      values.push(departmentId);
      conditions.push(`e.department_id = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`a.status = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM attendances a
       INNER JOIN employees e ON e.id = a.employee_id
       LEFT JOIN departments d ON d.id = e.department_id ${where}`, values
    );
    const summaryResult = await pool.query(
      `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE a.status = 'present')::int AS present,
        COUNT(*) FILTER (WHERE a.status = 'late')::int AS late,
        COUNT(*) FILTER (WHERE a.status = 'permission')::int AS permission,
        COUNT(*) FILTER (WHERE a.status = 'sick')::int AS sick,
        COUNT(*) FILTER (WHERE a.status = 'alpha')::int AS alpha
       FROM attendances a INNER JOIN employees e ON e.id = a.employee_id ${where}`, values
    );

    const offset = (pageNumber - 1) * pageSize;
    const dataValues = [...values, pageSize, offset];
    const result = await pool.query(
      `SELECT a.id, a.employee_id, e.nik,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        d.name AS department_name, e.position, a.date, a.clock_in, a.clock_out,
        a.status, a.overtime_hours, a.notes, a.checkin_latitude,
        a.checkin_longitude, a.checkin_accuracy_meters, a.created_at
       FROM attendances a
       INNER JOIN employees e ON e.id = a.employee_id
       LEFT JOIN departments d ON d.id = e.department_id
       ${where}
       ORDER BY a.date DESC, a.clock_in DESC NULLS LAST, e.first_name ASC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      dataValues
    );

    const officeLat = parseFloat(process.env.OFFICE_LAT);
    const officeLon = parseFloat(process.env.OFFICE_LON);
    const rows = result.rows.map((row) => {
      let distanceMeters = null;
      if (row.checkin_latitude != null && row.checkin_longitude != null &&
          Number.isFinite(officeLat) && Number.isFinite(officeLon)) {
        distanceMeters = Math.round(calculateDistance(
          officeLat, officeLon, Number(row.checkin_latitude), Number(row.checkin_longitude)
        ));
      }
      return { ...row, distance_meters: distanceMeters };
    });

    res.json({
      success: true,
      data: rows,
      summary: summaryResult.rows[0],
      pagination: {
        page: pageNumber, limit: pageSize, total: countResult.rows[0].total,
        total_pages: Math.ceil(countResult.rows[0].total / pageSize)
      }
    });
  } catch (error) {
    console.error('Gagal mengambil rekap absensi HR:', error);
    res.status(500).json({ success: false, message: 'Gagal memuat rekap absensi.' });
  }
});

// GET /api/attendances/chart-stats - Data rekap 7 hari terakhir untuk Chart.js
router.get('/chart-stats', async (req, res) => {
  try {
    const query = `
      SELECT TO_CHAR(date, 'Day') AS day_name,
             SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_count,
             SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_count,
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
              d.name AS department_name, a.date, a.clock_in, a.clock_out, a.status,
              a.overtime_hours, a.checkin_latitude, a.checkin_longitude,
              a.checkin_accuracy_meters
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
