import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import AppLayout from '../components/AppLayout.jsx';
import { statusColor, getUserRoleFromToken } from '../utils/helpers.js';

function LeaveManagement() {
  const isHR = getUserRoleFromToken() === 'HR_ADMIN';

  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      // HR melihat semua permohonan; karyawan hanya melihat miliknya
      const response = isHR
        ? await api.get('/leaves/requests')
        : await api.get('/leaves/my');
      if (response.data.success) setLeaveRequests(response.data.data);
    } catch (err) {
      console.error('Gagal memuat data cuti:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaveRequests(); }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      alert('Semua kolom wajib diisi!');
      return;
    }
    try {
      setSubmitting(true);
      const response = await api.post('/leaves/apply', { leave_type: leaveType, start_date: startDate, end_date: endDate, reason });
      if (response.data.success) {
        alert('Pengajuan cuti berhasil dikirim!');
        setStartDate(''); setEndDate(''); setReason('');
        fetchLeaveRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengajukan cuti.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproval = async (leaveId, status) => {
    const actionName = status === 'approved' ? 'menyetujui' : 'menolak';
    if (!window.confirm(`Apakah Anda yakin ingin ${actionName} pengajuan cuti ini?`)) return;
    try {
      const response = await api.put(`/leaves/approve/${leaveId}`, { status });
      if (response.data.success) {
        alert(response.data.message);
        fetchLeaveRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memproses approval.');
    }
  };

  return (
    <AppLayout title="Manajemen Cuti Karyawan">
      <div className="two-col">
        {/* Form pengajuan cuti */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>✍️ Ajukan Cuti Baru</h3>
          <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="f-label">Jenis Cuti</label>
              <select className="input" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                <option value="annual">Cuti Tahunan</option>
                <option value="sick">Cuti Sakit</option>
                <option value="unpaid">Cuti Tanpa Gaji</option>
              </select>
            </div>
            <div>
              <label className="f-label">Tanggal Mulai</label>
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div>
              <label className="f-label">Tanggal Selesai</label>
              <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
            <div>
              <label className="f-label">Alasan</label>
              <textarea className="input" rows="3" value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </form>
        </div>

        {/* Tabel persetujuan / riwayat */}
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{isHR ? '🛡️ Daftar Permohonan Cuti (HR Approval)' : '📋 Riwayat Cuti Saya'}</h3>
          {loading ? (
            <p className="muted">Memuat data permohonan...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    {isHR && <th>Karyawan</th>}
                    <th>Jenis</th>
                    <th>Tanggal</th>
                    <th>Alasan</th>
                    <th>Status</th>
                    {isHR && <th>Aksi (HR)</th>}
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.length > 0 ? leaveRequests.map((item) => (
                    <tr key={item.leave_id || item.id}>
                      {isHR && (
                        <td>
                          <strong>{item.employee_name}</strong>
                          <div style={{ fontSize: 11 }} className="muted">{item.department_name}</div>
                        </td>
                      )}
                      <td>{item.leave_type.toUpperCase()}</td>
                      <td>{item.start_date.split('T')[0]} s/d {item.end_date.split('T')[0]}</td>
                      <td>{item.reason}</td>
                      <td><span className="badge" style={{ backgroundColor: statusColor(item.status) }}>{item.status.toUpperCase()}</span></td>
                      {isHR && (
                        <td>
                          {item.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button className="btn btn-success" style={{ padding: '6px 10px' }} onClick={() => handleApproval(item.leave_id, 'approved')}>✔ Setuju</button>
                              <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleApproval(item.leave_id, 'rejected')}>✖ Tolak</button>
                            </div>
                          ) : (
                            <span className="muted" style={{ fontSize: 12 }}>Sudah diproses</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )) : (
                    <tr><td colSpan={isHR ? 6 : 4} style={{ textAlign: 'center' }} className="muted">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default LeaveManagement;
