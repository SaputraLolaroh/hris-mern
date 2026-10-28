import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import AppLayout from '../components/AppLayout.jsx';
import AttendanceChart from '../components/AttendanceChart.jsx';

function Dashboard() {
  const [statsData, setStatsData] = useState({
    total_employees: 'Memuat...',
    present_today: 'Memuat...',
    pending_leave: 'Memuat...',
    total_payroll: 'Memuat...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        if (response.data.success) setStatsData(response.data.data);
      } catch (err) {
        console.error('Gagal mengambil statistik:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { title: 'Total Karyawan', value: statsData.total_employees, change: 'Karyawan aktif', color: '#007bff' },
    { title: 'Kehadiran Hari Ini', value: statsData.present_today, change: 'Pencatatan real-time', color: '#28a745' },
    { title: 'Pending Cuti', value: statsData.pending_leave, change: 'Perlu persetujuan HR', color: '#ffc107' },
    { title: 'Total Penggajian (Bulan Ini)', value: statsData.total_payroll, change: 'Kalkulasi otomatis', color: '#6c757d' }
  ];

  return (
    <AppLayout title="Dashboard Overview">
      <div className="stats-grid">
        {stats.map((item, index) => (
          <div className="stat-card" key={index} style={{ borderLeftColor: item.color }}>
            <p className="stat-title">{item.title}</p>
            <h3 className="stat-value">{loading ? '...' : item.value}</h3>
            <span className="stat-change" style={{ color: item.color }}>{item.change}</span>
          </div>
        ))}
      </div>
      <AttendanceChart />
    </AppLayout>
  );
}

export default Dashboard;
