import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?')) return;
    try {
      // Opsional: beritahu backend untuk logging/audit
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('jwt_token');
      alert('Anda berhasil keluar.');
      navigate('/login', { replace: true });
    }
  };

  return (
    <button className="btn btn-danger" onClick={handleLogout}>🚪 Keluar</button>
  );
}

export default LogoutButton;
