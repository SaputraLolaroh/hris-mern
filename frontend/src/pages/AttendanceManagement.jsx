import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios.js';
import AppLayout from '../components/AppLayout.jsx';

const statusLabels = {
  present: 'Hadir',
  late: 'Terlambat',
  permission: 'Izin',
  sick: 'Sakit',
  alpha: 'Tidak hadir'
};

function formatDate(value) {
  if (!value) return '-';
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : '-';
}

function AttendanceManagement() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const toInputDate = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const [filters, setFilters] = useState({
    startDate: toInputDate(firstDay),
    endDate: toInputDate(today),
    search: '',
    status: ''
  });
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1, limit: 25 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/attendances', {
        params: { ...filters, page, limit: 25 }
      });
      setRows(response.data.data || []);
      setSummary(response.data.summary || {});
      setPagination(response.data.pagination || { page: 1, total: 0, total_pages: 1, limit: 25 });
    } catch (err) {
      setError(err.response?.data?.message || 'Tidak dapat memuat data absensi. Periksa koneksi dan hak akses HR_ADMIN.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const response = await api.get('/attendances/export-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Rekap_Absensi_HRIS.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunduh rekap Excel.');
    } finally {
      setExporting(false);
    }
  };

  const cards = [
    { label: 'Total catatan', value: summary.total ?? 0, tone: 'blue' },
    { label: 'Hadir', value: summary.present ?? 0, tone: 'green' },
    { label: 'Terlambat', value: summary.late ?? 0, tone: 'orange' },
    { label: 'Izin / Sakit', value: (summary.permission ?? 0) + (summary.sick ?? 0), tone: 'purple' },
    { label: 'Tidak hadir', value: summary.alpha ?? 0, tone: 'red' }
  ];

  return (
    <AppLayout title="Manajemen Absensi">
      <div className="attendance-page">
        <div className="attendance-heading">
          <div>
            <h2>Rekap Kehadiran Karyawan</h2>
            <p className="muted">Pantau jam kerja dan verifikasi lokasi check-in GPS karyawan.</p>
          </div>
          <button className="btn btn-success" onClick={exportExcel} disabled={exporting}>
            {exporting ? 'Menyiapkan...' : '⬇ Ekspor Excel'}
          </button>
        </div>

        <div className="attendance-summary">
          {cards.map((card) => (
            <div className={`attendance-summary-card ${card.tone}`} key={card.label}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>

        <section className="card attendance-filter">
          <label>
            <span className="f-label">Dari tanggal</span>
            <input className="input" type="date" value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)} />
          </label>
          <label>
            <span className="f-label">Sampai tanggal</span>
            <input className="input" type="date" value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)} />
          </label>
          <label>
            <span className="f-label">Cari karyawan</span>
            <input className="input" value={filters.search} placeholder="Nama atau NIK..."
              onChange={(e) => updateFilter('search', e.target.value)} />
          </label>
          <label>
            <span className="f-label">Status</span>
            <select className="input" value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}>
              <option value="">Semua status</option>
              <option value="present">Hadir</option>
              <option value="late">Terlambat</option>
              <option value="permission">Izin</option>
              <option value="sick">Sakit</option>
              <option value="alpha">Tidak hadir</option>
            </select>
          </label>
        </section>

        {error && <div className="attendance-error" role="alert">{error}</div>}

        <section className="card attendance-table-card">
          <div className="attendance-table-title">
            <div>
              <h3>Riwayat Absensi</h3>
              <span className="muted">{pagination.total || 0} catatan ditemukan</span>
            </div>
            <button className="btn btn-secondary" onClick={fetchAttendance} disabled={loading}>↻ Muat ulang</button>
          </div>
          <div className="attendance-table-wrap">
            <table className="tbl attendance-table">
              <thead>
                <tr>
                  <th>Tanggal</th><th>Karyawan</th><th>Departemen</th>
                  <th>Masuk</th><th>Pulang</th><th>Status</th><th>Lokasi GPS</th><th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="attendance-empty">Memuat data absensi...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="8" className="attendance-empty">Belum ada data absensi pada periode ini.</td></tr>
                ) : rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.date)}</td>
                    <td><strong>{row.employee_name}</strong><small>{row.nik}</small></td>
                    <td>{row.department_name || '-'}</td>
                    <td>{formatTime(row.clock_in)}</td>
                    <td>{formatTime(row.clock_out)}</td>
                    <td><span className={`attendance-status ${row.status}`}>{statusLabels[row.status] || row.status}</span></td>
                    <td>
                      {row.checkin_latitude != null && row.checkin_longitude != null
                        ? <a href={`https://www.google.com/maps?q=${row.checkin_latitude},${row.checkin_longitude}`}
                            target="_blank" rel="noreferrer">Lihat peta ↗</a>
                        : <span className="muted">Tidak tersedia</span>}
                    </td>
                    <td><button className="attendance-detail-btn" onClick={() => setSelected(row)}>Lihat</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="attendance-pagination">
            <span className="muted">Halaman {pagination.page || page} dari {pagination.total_pages || 1}</span>
            <div>
              <button className="btn btn-secondary" disabled={loading || page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}>Sebelumnya</button>
              <button className="btn btn-primary" disabled={loading || page >= (pagination.total_pages || 1)}
                onClick={() => setPage((value) => value + 1)}>Berikutnya</button>
            </div>
          </div>
        </section>

        {selected && (
          <div className="attendance-modal-backdrop" onClick={() => setSelected(null)}>
            <section className="attendance-modal card" role="dialog" aria-modal="true"
              aria-labelledby="attendance-detail-title" onClick={(e) => e.stopPropagation()}>
              <div className="attendance-table-title">
                <h3 id="attendance-detail-title">Detail Absensi</h3>
                <button className="attendance-close" onClick={() => setSelected(null)} aria-label="Tutup">×</button>
              </div>
              <h4>{selected.employee_name}</h4>
              <p className="muted">{selected.nik} · {selected.department_name || 'Tanpa departemen'}</p>
              <div className="attendance-detail-grid">
                <div><span>Tanggal</span><strong>{formatDate(selected.date)}</strong></div>
                <div><span>Status</span><strong>{statusLabels[selected.status] || selected.status}</strong></div>
                <div><span>Jam masuk</span><strong>{formatTime(selected.clock_in)}</strong></div>
                <div><span>Jam pulang</span><strong>{formatTime(selected.clock_out)}</strong></div>
                <div><span>Akurasi GPS</span><strong>{selected.checkin_accuracy_meters != null ? `±${Math.round(Number(selected.checkin_accuracy_meters))} meter` : 'Tidak tersedia'}</strong></div>
                <div><span>Jarak dari kantor</span><strong>{selected.distance_meters != null ? `${selected.distance_meters} meter` : 'Belum dihitung'}</strong></div>
                <div><span>Latitude</span><strong>{selected.checkin_latitude ?? '-'}</strong></div>
                <div><span>Longitude</span><strong>{selected.checkin_longitude ?? '-'}</strong></div>
              </div>
              {selected.checkin_latitude != null && selected.checkin_longitude != null && (
                <a className="btn btn-primary attendance-map-link"
                  href={`https://www.google.com/maps?q=${selected.checkin_latitude},${selected.checkin_longitude}`}
                  target="_blank" rel="noreferrer">Buka lokasi di Google Maps ↗</a>
              )}
              <p className="muted attendance-privacy-note">Koordinat adalah data lokasi saat check-in, bukan pelacakan GPS secara terus-menerus.</p>
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default AttendanceManagement;
