# 🏢 HRIS Enterprise — Sistem Informasi Sumber Daya Manusia

Aplikasi HRIS full-stack berbasis PostgreSQL, Express.js, React.js, dan Node.js (MERN-like), dengan rancangan deployment di Amazon Web Services (AWS).

## 📦 Modul Utama

| Modul | Deskripsi |
|---|---|
| Autentikasi | Login JWT, bcrypt, dan Role-Based Access Control (`HR_ADMIN` / `EMPLOYEE`) |
| Karyawan | CRUD data karyawan untuk HR Admin |
| Absensi | Check-in GPS dengan validasi radius kantor menggunakan Haversine Formula, check-out, dan penyimpanan koordinat |
| Manajemen Absensi HR | Rekap seluruh karyawan, filter periode/nama/status, detail koordinat, akurasi GPS, jarak dari kantor, dan tautan Google Maps |
| Cuti | Pengajuan cuti dan alur persetujuan HR |
| Payroll | Laporan gaji per periode, pembuatan draf penggajian, dan slip gaji PDF |
| Dashboard | Statistik dan grafik absensi |
| Ekspor | Rekap absensi Excel termasuk data GPS |
| AWS | Penyimpanan S3 melalui IAM Role dan kebijakan least privilege |

## 🚀 Menjalankan Secara Lokal

### Prasyarat

- Node.js >= 18
- PostgreSQL >= 14

### 1. Database

Untuk database baru:

```bash
createdb hris_db
psql hris_db < database/schema.sql
```

Untuk database yang sudah berjalan, terapkan migrasi GPS satu kali:

```bash
psql "$DATABASE_URL" -f database/migrations/2026_11_09_add_attendance_gps.sql
```

Atau buka Neon Console → SQL Editor, lalu jalankan isi file `database/migrations/2026_11_09_add_attendance_gps.sql`.

Migrasi ini menambahkan kolom `checkin_latitude`, `checkin_longitude`, dan `checkin_accuracy_meters` secara aman jika kolom belum ada. Jalankan migrasi sebelum karyawan melakukan check-in dengan versi aplikasi baru. Riwayat absensi lama tetap tersedia, tetapi koordinat GPS untuk catatan lama tidak dapat dipulihkan.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Konfigurasikan variabel lingkungan di `.env` sebelum menjalankan backend. Server berjalan di `http://localhost:5000`.

Pastikan `OFFICE_LAT`, `OFFICE_LON`, dan `MAX_RADIUS_METERS` diisi dengan koordinat serta radius kantor yang benar. Gunakan HTTPS pada produksi agar akses lokasi browser dapat berjalan.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`.

### 4. Halaman Manajemen Absensi HR

Login menggunakan akun dengan role `HR_ADMIN`, lalu buka menu **Manajemen Absensi** atau URL `/attendance/management`.

Halaman ini menyediakan filter tanggal, pencarian nama/NIK, filter status, detail catatan absensi, peta lokasi check-in, serta ekspor Excel. Endpoint rekap dan ekspor dilindungi middleware role `HR_ADMIN`.

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

## 🔐 Keamanan dan Privasi

- Jangan pernah commit file `.env`, token, password, atau kredensial cloud.
- Aktifkan HTTPS untuk produksi.
- Lindungi endpoint berdasarkan autentikasi dan hak akses.
- Data lokasi hanya direkam saat check-in untuk verifikasi kehadiran; fitur ini bukan pelacakan GPS terus-menerus.
- Beri tahu karyawan tentang pencatatan lokasi dan batasi akses koordinat hanya untuk petugas HR yang berwenang.
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
│   ├── migrations/
│   └── schema.sql
└── deploy/
```
