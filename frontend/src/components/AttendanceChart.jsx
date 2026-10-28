import { useState, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '../api/axios.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AttendanceChart() {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await api.get('/attendances/chart-stats');
        if (response.data.success) {
          const rows = response.data.data;
          setChartData({
            labels: rows.map((item) => item.day_name.trim()),
            datasets: [
              { label: 'Hadir Tepat Waktu', data: rows.map((i) => parseInt(i.present_count)), backgroundColor: 'rgba(40,167,69,0.8)', borderRadius: 4 },
              { label: 'Terlambat', data: rows.map((i) => parseInt(i.late_count)), backgroundColor: 'rgba(255,193,7,0.8)', borderRadius: 4 },
              { label: 'Izin / Sakit', data: rows.map((i) => parseInt(i.leave_count)), backgroundColor: 'rgba(220,53,69,0.8)', borderRadius: 4 }
            ]
          });
        }
      } catch (err) {
        console.error('Gagal memuat data grafik absensi:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 10 } } }
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>📊 Grafik Kehadiran (7 Hari Terakhir)</h3>
      <div style={{ position: 'relative', height: 250 }}>
        {loading ? <p className="muted">Memuat grafik...</p> : <Bar data={chartData} options={chartOptions} />}
      </div>
    </div>
  );
}

export default AttendanceChart;
