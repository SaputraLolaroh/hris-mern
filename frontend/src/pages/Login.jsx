import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('jwt_token', response.data.token);
        alert('Login berhasil!');
        navigate('/dashboard');
      }
    } catch (err) {
      alert('Login gagal: ' + (err.response?.data?.message || 'Terjadi kesalahan koneksi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-box">
      <h2 style={{ textAlign: 'center', marginTop: 0 }}>🏢 HRIS Enterprise</h2>
      <p className="muted" style={{ textAlign: 'center' }}>Silakan login untuk melanjutkan</p>
      <form onSubmit={handleLogin}>
        <div>
          <label className="f-label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="f-label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
      <div className="muted" style={{ fontSize: 12, marginTop: 18, padding: 12, border: '1px solid #d1d5db', borderRadius: 8 }}>
        <p style={{ fontWeight: 600, marginTop: 0, marginBottom: 8 }}>Akun Demo untuk Mencoba Aplikasi</p>
        <p style={{ margin: '6px 0' }}><strong>Admin Demo</strong><br />Email: admin@hris.com<br />Password: admin123</p>
        <p style={{ margin: '10px 0 0' }}><strong>Karyawan Demo</strong><br />Email: budi@hris.com<br />Password: admin123</p>
      </div>
    </div>
  );
}

export default Login;
