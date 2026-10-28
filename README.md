# 🏢 HRIS Enterprise — Sistem Informasi Sumber Daya Manusia

Aplikasi HRIS full-stack berbasis PostgreSQL, Express.js, React.js, dan Node.js (MERN-like), dengan rancangan deployment di Amazon Web Services (AWS).

## 📦 Modul Utama

| Modul | Deskripsi |
|---|---|
| Autentikasi | Login JWT, bcrypt, dan Role-Based Access Control (`HR_ADMIN` / `EMPLOYEE`) |
| Karyawan | CRUD data karyawan untuk HR Admin |
| Absensi | Check-in GPS dengan validasi radius kantor menggunakan Haversine Formula, dan check-out |
| Cuti | Pengajuan cuti dan alur persetujuan HR |
| Payroll | Laporan gaji per periode, pembuatan draf penggajian, dan slip gaji PDF |
| Dashboard | Statistik dan grafik absensi |
| Ekspor | Rekap absensi Excel |
| AWS | Penyimpanan S3 melalui IAM Role dan kebijakan least privilege |

## 🚀 Menjalankan Secara Lokal

### Prasyarat

- Node.js >= 18
- PostgreSQL >= 14

### 1. Database

```bash
createdb hris_db
psql hris_db < database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Konfigurasikan variabel lingkungan di `.env` sebelum menjalankan backend. Server berjalan di `http://localhost:5000`.

### 3. Frontend

Buka terminal baru dari direktori proyek:

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

### Akun Demo

- Admin: `admin@hris.com`
- Karyawan: `budi@hris.com`
- Password demo: `admin123`

Ganti kredensial demo sebelum aplikasi digunakan secara nyata.

## ☁️ Deployment AWS

1. **Database:** Amazon RDS for PostgreSQL.
2. **Penyimpanan:** S3 privat dengan IAM Role dan kebijakan di `deploy/iam-policy-s3.json`.
3. **Backend:** EC2 Ubuntu dengan Node.js, PM2, dan Nginx. Lihat `deploy/nginx-hris-backend.conf`.
4. **Frontend:** Jalankan `npm run build`, lalu deploy ke AWS Amplify atau S3 + CloudFront.
5. **Konfigurasi produksi:** Simpan rahasia di environment server atau secret manager.

## 🔐 Keamanan

- Jangan pernah commit file `.env`, token, password, atau kredensial cloud.
- Aktifkan HTTPS untuk produksi.
- Lindungi endpoint berdasarkan autentikasi dan hak akses.
- Audit validasi input, akses data karyawan, dan alur payroll sebelum penggunaan produksi.
- Pertimbangkan HttpOnly cookies untuk membantu mengurangi risiko pencurian token melalui XSS.

## 📁 Struktur Proyek

```text
hris-mern/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   └── utils/
├── frontend/
│   └── src/
├── database/
│   └── schema.sql
└── deploy/
```

