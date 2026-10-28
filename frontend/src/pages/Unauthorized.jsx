import { useNavigate } from 'react-router-dom';

function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: 20 }}>
      <h1 style={{ fontSize: 80, margin: 0, color: '#dc3545' }}>403</h1>
      <h2>Akses Ditolak (Unauthorized)</h2>
      <p className="muted" style={{ maxWidth: 400 }}>
        Maaf, Anda tidak memiliki hak akses yang cukup untuk membuka halaman ini. Halaman ini khusus untuk Administrator HR.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>⬅️ Kembali Sebelumnya</button>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard', { replace: true })}>🏠 Ke Dashboard Utama</button>
      </div>
    </div>
  );
}

export default Unauthorized;
