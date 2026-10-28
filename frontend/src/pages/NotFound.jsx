import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: 20 }}>
      <h1 style={{ fontSize: 80, margin: 0, color: '#6c757d' }}>404</h1>
      <h2>Halaman Tidak Ditemukan</h2>
      <p className="muted">Alamat yang Anda tuju tidak tersedia.</p>
      <button className="btn btn-primary" onClick={() => navigate('/')}>🏠 Kembali ke Beranda</button>
    </div>
  );
}

export default NotFound;
