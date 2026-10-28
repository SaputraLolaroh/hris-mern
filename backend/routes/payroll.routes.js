const express = require('express');
const pool = require('../config/db');
const { verifyToken, checkRole } = require('../middleware/auth');
const { generatePresignedDownloadUrl, uploadFileToS3 } = require('../services/s3.service');

const router = express.Router();
router.use(verifyToken);

// GET /api/payrolls/report - Laporan gaji per periode (HR_ADMIN saja)
// Contoh akses: /api/payrolls/report?month=10&year=2026
router.get('/report', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const month = parseInt(req.query.month || new Date().getMonth() + 1, 10);
    const year = parseInt(req.query.year || new Date().getFullYear(), 10);

    const query = `
      SELECT e.nik, CONCAT(e.first_name, ' ', e.last_name) AS full_name,
             d.name AS department_name, e.position,
             p.period_month, p.period_year, p.base_salary, p.allowance,
             p.overtime_pay, p.deductions, p.net_salary, p.status AS payroll_status,
             p.payslip_url
      FROM employees e
      INNER JOIN departments d ON e.department_id = d.id
      INNER JOIN payrolls p ON e.id = p.employee_id
      WHERE p.period_month = $1 AND p.period_year = $2
      ORDER BY d.name ASC, e.first_name ASC`;
    const result = await pool.query(query, [month, year]);

    res.status(200).json({
      success: true,
      message: `Berhasil mengambil laporan gaji periode ${month}/${year}`,
      total_data: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error saat mengambil laporan gaji:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server internal.' });
  }
});

// POST /api/payrolls/generate - Generate draf payroll massal satu periode (HR_ADMIN saja)
// Rumus: Gaji Bersih = Pokok + Tunjangan + Lembur - Potongan
router.post('/generate', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const { month, year, allowance = 0, deductions = 0, overtime_pay = 0 } = req.body;
    if (!month || !year || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Periode bulan/tahun tidak valid.' });
    }

    // Ambil semua karyawan aktif yang belum punya payroll di periode ini
    const employees = await pool.query(
      `SELECT id, base_salary FROM employees
       WHERE status = 'active'
         AND id NOT IN (SELECT employee_id FROM payrolls WHERE period_month = $1 AND period_year = $2)`,
      [month, year]
    );

    let created = 0;
    for (const emp of employees.rows) {
      const netSalary = Number(emp.base_salary) + Number(allowance) + Number(overtime_pay) - Number(deductions);
      await pool.query(
        `INSERT INTO payrolls (employee_id, period_month, period_year, base_salary,
          allowance, overtime_pay, deductions, net_salary, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft')`,
        [emp.id, month, year, emp.base_salary, allowance, overtime_pay, deductions, netSalary]
      );
      created++;
    }

    res.status(201).json({ success: true, message: `Payroll draf berhasil dibuat untuk ${created} karyawan.` });
  } catch (error) {
    console.error('Error generate payroll:', error);
    res.status(500).json({ success: false, message: 'Gagal memproses penggajian.' });
  }
});

// PUT /api/payrolls/:id/status - Update status payroll draft -> approved -> paid (HR_ADMIN saja)
router.put('/:id/status', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['draft', 'approved', 'paid'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status payroll tidak valid.' });
    }
    const result = await pool.query(
      'UPDATE payrolls SET status = $1, paid_at = CASE WHEN $1 = \'paid\' THEN CURRENT_TIMESTAMP ELSE paid_at END WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data payroll tidak ditemukan.' });
    }
    res.status(200).json({ success: true, message: `Status payroll berhasil diubah menjadi ${status}.`, data: result.rows[0] });
  } catch (error) {
    console.error('Error update status payroll:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status payroll.' });
  }
});

// POST /api/payrolls/upload-slip - Unggah file PDF slip gaji ke S3 (HR_ADMIN saja)
router.post('/upload-slip', checkRole('HR_ADMIN'), async (req, res) => {
  try {
    const { payrollId, pdfBase64, fileName } = req.body; // pdfBase64: file PDF dalam base64
    if (!payrollId || !pdfBase64 || !fileName) {
      return res.status(400).json({ success: false, message: 'payrollId, pdfBase64, dan fileName wajib diisi.' });
    }

    const buffer = Buffer.from(pdfBase64, 'base64');
    const s3Key = `payslips/${fileName}`;
    const s3Url = await uploadFileToS3(buffer, s3Key, 'application/pdf');

    // Simpan URL file ke kolom payslip_url di tabel payrolls
    await pool.query('UPDATE payrolls SET payslip_url = $1 WHERE id = $2', [s3Url, payrollId]);

    res.status(200).json({ success: true, message: 'Slip gaji berhasil diunggah ke AWS S3.', file_url: s3Url });
  } catch (error) {
    console.error('Error upload slip ke S3:', error);
    res.status(500).json({ success: false, message: 'Upload S3 gagal.' });
  }
});

// GET /api/payrolls/download-token - Presigned URL aman untuk unduh slip gaji
// Contoh akses: /api/payrolls/download-token?filename=payslips/EMP-001_10_2026.pdf
router.get('/download-token', async (req, res) => {
  try {
    const filePath = req.query.filename;
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Parameter filename wajib diisi.' });
    }

    const expiresInSeconds = 300; // Tautan berlaku 5 menit
    const presignedUrl = await generatePresignedDownloadUrl(filePath, expiresInSeconds);

    res.status(200).json({
      success: true,
      message: 'Presigned URL berhasil dibuat.',
      download_url: presignedUrl,
      expires_in: `${expiresInSeconds} detik`
    });
  } catch (error) {
    console.error('Gagal membuat Presigned URL:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
