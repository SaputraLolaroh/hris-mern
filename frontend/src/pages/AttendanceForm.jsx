import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import AppLayout from '../components/AppLayout.jsx';

function AttendanceForm() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ambil koordinat GPS browser (Promise wrapper)
  const getCoordinates = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser Anda.'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => reject(new Error('Gagal mendeteksi lokasi. Pastikan izin GPS/Lokasi diaktifkan.')),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    });

  const handleClockAction = async (type) => {
    const actionName = type === 'check-in' ? 'Check-In' : 'Check-Out';
    if (!window.confirm(`Apakah Anda yakin ingin melakukan ${actionName}?`)) return;
    try {
      setLoading(true);
      setMessage({ text: 'Mendeteksi lokasi GPS Anda...', type: 'info' });

      let latitude = null, longitude = null;
      if (type === 'check-in') {
        const coords = await getCoordinates();
        latitude = coords.latitude;
        longitude = coords.longitude;
      }

      setMessage({ text: 'Mengirim data ke server...', type: 'info' });
      const response = await api.post('/attendances/clock', { type, latitude, longitude });
      if (response.data.success) setMessage({ text: response.data.message, type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || err.message || 'Terjadi kesalahan koneksi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Portal Absensi Berbasis GPS">
      <div className="card" style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 36, fontWeight: 'bold', color: '#007bff', margin: '20px 0', background: '#f8f9fa', padding: 15, borderRadius: 6 }}>
          {currentTime.toLocaleTimeString('id-ID')}
        </div>
        <p className="muted">
          Tanggal: <strong>{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
        </p>
        {message.text && (
          <p className={message.type === 'success' ? 'success' : message.type === 'error' ? 'error' : 'muted'}>
            {message.text}
          </p>
        )}
        <div style={{ display: 'flex', gap: 15, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-success" onClick={() => handleClockAction('check-in')} disabled={loading}>
            📥 Check-In (GPS)
          </button>
          <button className="btn btn-danger" onClick={() => handleClockAction('check-out')} disabled={loading}>
            📤 Check-Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

export default AttendanceForm;
