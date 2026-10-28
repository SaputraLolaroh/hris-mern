# 🏢 HRIS Enterprise — Sistem Informasi Sumber Daya Manusia (MERN Stack)

Aplikasi HRIS full-stack berbasis **MongoDB-style architecture dengan PostgreSQL, Express.js, React.js, Node.js (MERN-like)** dengan deployment di **Amazon Web Services (AWS)**.

## 📦 Modul Utama

| Modul | Deskripsi |
|---|---|
| 🔐 Autentikasi | Login JWT (expiring token), bcrypt password, Role-Based Access Control (`HR_ADMIN` vs `EMPLOYEE`) |
| 👥 Karyawan | CRUD lengkap data karyawan (khusus HR Admin) |
| 🕒 Absensi | Check-in wajib GPS dengan validasi radius kantor (Haversine Formula), check-out, jam digital real-time |
| 📋 Cuti | Pengajuan cuti + approval workflow (pending → approved/rejected) oleh HR |
| 💰 Payroll | Laporan gaji per periode (JOIN query), generate draf massal, slip gaji PDF (jsPDF), unduhan aman via S3 Presigned URL |
| 📊 Dashboard | Kartu statistik real-time + grafik Chart.js (7 hari terakhir) |
| 📄 Ekspor | Rekap absensi ke file Excel `.xlsx` dengan styling (ExcelJS) |
| ☁️ AWS | S3 upload via IAM Role (tanpa hardcode access key), custom IAM Policy (Least Privilege) |

## 🚀 Menjalankan Secara Lokal (Development)

### Prasyarat
- Node.js >= 18
- PostgreSQL >= 14 (atau Amazon RDS)

### 1. Database
```bash
createdb hris_db
psql hris_db < database/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env       # lalu sesuaikan konfigurasi
npm install
npm run seed               # buat akun demo (admin@hris.com / admin123)
npm run dev                # server jalan di http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                # jalan di http://localhost:5173
```

Login demo: `admin@hris.com` / `admin123` (HR Admin) atau `budi@hris.com` / `admin123` (Karyawan).

## ☁️ Deployment ke AWS (Ringkasan)

1. **Database** → Amazon RDS (PostgreSQL). Security Group hanya mengizinkan port 5432 dari Security Group backend.
2. **File storage** → S3 Bucket (`hris-company-storage`), Block Public Access aktif. Lampirkan IAM Policy di `deploy/iam-policy-s3.json` ke IAM Role EC2.
3. **Backend** → EC2 Ubuntu: instal Node.js + Nginx + PM2. Kloning repo, buat `.env` produksi (`chmod 600 .env`), jalankan `pm2 start ecosystem.config.js --env production`, konfigurasi Nginx (lihat `deploy/nginx-hris-backend.conf`), pasang SSL dengan Certbot.
4. **Frontend** → `npm run build`, unggah folder `dist/` ke AWS Amplify atau S3 + CloudFront.
5. **Environment variables produksi** diisi di `.env` server / PM2 `env_production` / AWS SSM Parameter Store. Jangan pernah commit `.env` ke Git.

## 🔐 Catatan Keamanan

- Token JWT disimpan di `localStorage` + dikirim via Axios Interceptor; token 401 otomatis memaksa logout.
- Password di-hash dengan **bcrypt** (cost factor 10).
- Endpoint sensitif dilindungi middleware `verifyToken` + `checkRole('HR_ADMIN')`.
- Presigned URL S3 berlaku hanya **60 detik**; bucket tetap privat.
- Di produksi skala besar, pertimbangkan pindahkan JWT ke **HttpOnly Cookie** untuk mitigasi XSS.
- Gunakan HTTPS di semua environment produksi.

## 📁 Struktur Proyek

```
hris-mern/
├── backend/
│   ├── config/db.js           # Koneksi PostgreSQL (Pool)
│   ├── middleware/auth.js     # verifyToken + checkRole (RBAC)
│   ├── routes/                # auth, employees, attendances, leaves, payrolls, dashboard
│   ├── services/              # s3.service.js, excel.service.js
│   ├── utils/geo.js           # Haversine Formula
│   ├── scripts/seed.js        # Akun demo
│   └── ecosystem.config.js    # Konfigurasi PM2 (cluster mode)
├── frontend/
│   ├── src/api/axios.js       # Instance Axios + Interceptor JWT
│   ├── src/components/        # ProtectedRoute, RoleRoute, AppLayout, AttendanceChart, LogoutButton
│   ├── src/pages/             # Login, Dashboard, Absensi, Cuti, Karyawan, Payroll, 403, 404
│   └── src/utils/helpers.js   # formatRupiah, statusColor, decode role JWT
├── database/schema.sql        # Skema PostgreSQL lengkap
└── deploy/                    # nginx.conf + IAM policy S3
```
