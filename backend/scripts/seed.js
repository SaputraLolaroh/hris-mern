// Script seed: membuat akun admin HR awal + contoh data untuk development
// Jalankan: npm run seed
const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await pool.query(
      `INSERT INTO employees (nik, first_name, last_name, email, password, position,
        department_id, base_salary, join_date, role, status)
       VALUES ('ADMIN-001', 'Admin', 'HR', 'admin@hris.com', $1, 'HR Administrator', 2, 0, CURRENT_DATE, 'HR_ADMIN', 'active')
       ON CONFLICT (email) DO NOTHING`,
      [hashedPassword]
    );

    await pool.query(
      `INSERT INTO employees (nik, first_name, last_name, email, password, position,
        department_id, base_salary, join_date, role, status)
       VALUES ('EMP-001', 'Budi', 'Santoso', 'budi@hris.com', $1, 'Full-Stack Developer', 1, 8500000, CURRENT_DATE, 'EMPLOYEE', 'active')
       ON CONFLICT (email) DO NOTHING`,
      [hashedPassword]
    );

    console.log('Seed berhasil!');
    console.log('  Admin : admin@hris.com / admin123');
    console.log('  Karyawan: budi@hris.com / admin123');
    process.exit(0);
  } catch (error) {
    console.error('Seed gagal:', error);
    process.exit(1);
  }
}

seed();
