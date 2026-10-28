# 🏢 HRIS Enterprise — Sistem Informasi Sumber Daya Manusia

Aplikasi HRIS full-stack berbasis PostgreSQL, Express.js, React.js, dan Node.js (MERN-like), dengan rancangan deployment di Amazon Web Services (AWS).

## Modul utama

| Modul | Deskripsi |
|---|---|
| Autentikasi | Login JWT, bcrypt, dan Role-Based Access Control (HR_ADMIN / EMPLOYEE) |
| Karyawan | CRUD data karyawan untuk HR Admin |
| Absensi | Check-in GPS dengan validasi radius kantor, check-out |
| Cuti | Pengajuan dan persetujuan cuti |
| Payroll | Laporan gaji, draf penggajian, dan slip gaji PDF |
| Dashboard | Statistik dan grafik absensi |
| Ekspor | Rekap absensi Excel |
| AWS | Penyimpanan S3 melalui IAM Role dan kebijakan least privilege |

## Menjalankan secara lokal

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
# Isi variabel di .env sesuai database dan konfigurasi lokal
npm install
npm run seed
npm run dev
```
Backend berjalan di `http://localhost:5000`.

### 3. Frontend
Buka terminal baru:
```bash
cd frontend
npm install
npm run dev
```
Frontend berjalan di `http://localhost:5173`.

Akun demo yang disiapkan oleh seed: `admin@hris.com` dan `budi@hris.com`, keduanya menggunakan password demo `admin123`. Ganti kredensial demo sebelum penggunaan nyata.

## Deployment AWS (ringkasan)

1. Database: Amazon RDS for PostgreSQL.
2. Penyimpanan: S3 privat dengan IAM Role dan kebijakan di `deploy/iam-policy-s3.json`.
3. Backend: EC2 Ubuntu + Node.js + PM2 + Nginx; lihat `deploy/nginx-hris-backend.conf`.
4. Frontend: build dengan `npm run build`, lalu deploy ke AWS Amplify atau S3 + CloudFront.
5. Simpan konfigurasi produksi di secret manager atau environment server.

## Keamanan

- Jangan pernah commit file `.env`, token, password, atau kredensial cloud.
- Aktifkan HTTPS untuk produksi.
- Evaluasi penggunaan HttpOnly cookies untuk token dan pengamanan XSS.
- Audit semua endpoint, validasi input, izin akses, dan alur payroll sebelum penggunaan produksi.

## Struktur proyek

```
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
├── database/schema.sql
└── deploy/
```

> Status: README awal. Pastikan source code lengkap dari arsip proyek juga di-commit ke repository sebelum menjalankan atau melakukan deployment.
