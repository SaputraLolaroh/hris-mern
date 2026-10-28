import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import AppLayout from '../components/AppLayout.jsx';
import { formatRupiah, statusColor } from '../utils/helpers.js';

const EMPTY_FORM = {
  nik: '', first_name: '', last_name: '', email: '', password: '',
  phone_number: '', department_id: 1, position: '', base_salary: '',
  bank_name: '', bank_account: '', join_date: '', status: 'active'
};

function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      if (response.data.success) setEmployees(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const { nik, email, password, join_date, ...updateData } = formData;
        await api.put(`/employees/${currentId}`, updateData);
        alert('Data karyawan berhasil diperbarui!');
      } else {
        await api.post('/employees', formData);
        alert('Karyawan baru berhasil ditambahkan!');
      }
      setIsEditing(false);
      setCurrentId(null);
      setFormData(EMPTY_FORM);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Terjadi kesalahan.');
    }
  };

  const handleEdit = (emp) => {
    setIsEditing(true);
    setCurrentId(emp.id);
    setFormData({ ...EMPTY_FORM, ...emp, password: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus karyawan ini?')) return;
    try {
      await api.delete(`/employees/${id}`);
      alert('Karyawan berhasil dihapus.');
      fetchEmployees();
    } catch (err) {
      alert('Gagal menghapus karyawan.');
    }
  };

  const inputFields = [
    { name: 'nik', placeholder: 'NIK', show: !isEditing },
    { name: 'first_name', placeholder: 'Nama Depan' },
    { name: 'last_name', placeholder: 'Nama Belakang' },
    { name: 'email', placeholder: 'Email', type: 'email', show: !isEditing },
    { name: 'password', placeholder: 'Password (untuk login)', type: 'password', show: !isEditing },
    { name: 'phone_number', placeholder: 'No Telepon' },
    { name: 'position', placeholder: 'Jabatan (Position)' },
    { name: 'base_salary', placeholder: 'Gaji Pokok', type: 'number' },
    { name: 'bank_name', placeholder: 'Nama Bank' },
    { name: 'bank_account', placeholder: 'No Rekening' },
    { name: 'join_date', placeholder: 'Tanggal Bergabung', type: 'date', show: !isEditing }
  ];

  return (
    <AppLayout title="Manajemen Data Karyawan (CRUD)">
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{isEditing ? '✏️ Edit Data Karyawan' : '➕ Tambah Karyawan Baru'}</h3>
        <form onSubmit={handleSubmit} className="form-grid">
          {inputFields.filter((f) => f.show !== false).map((f) => (
            <input
              key={f.name}
              className="input"
              type={f.type || 'text'}
              name={f.name}
              placeholder={f.placeholder}
              value={formData[f.name]}
              onChange={handleChange}
              required={f.name !== 'phone_number' && f.name !== 'bank_name' && f.name !== 'bank_account'}
            />
          ))}
          {isEditing && (
            <select className="input" name="status" value={formData.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="resigned">Resigned</option>
              <option value="suspended">Suspended</option>
            </select>
          )}
          <div style={{ gridColumn: 'span 3', display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" type="submit">
              {isEditing ? 'Simpan Perubahan' : 'Tambah Karyawan'}
            </button>
            {isEditing && (
              <button className="btn btn-secondary" type="button" onClick={() => { setIsEditing(false); setFormData(EMPTY_FORM); }}>
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>📋 Daftar Karyawan</h3>
        {loading ? <p className="muted">Memuat data...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr><th>NIK</th><th>Nama Lengkap</th><th>Email</th><th>Jabatan</th><th>Gaji Pokok</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {employees.length > 0 ? employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.nik}</td>
                    <td>{emp.first_name} {emp.last_name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.position}</td>
                    <td>{formatRupiah(emp.base_salary)}</td>
                    <td><span className="badge" style={{ backgroundColor: statusColor(emp.status) }}>{emp.status.toUpperCase()}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-warning" style={{ padding: '6px 10px' }} onClick={() => handleEdit(emp)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => handleDelete(emp.id)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" style={{ textAlign: 'center' }} className="muted">Tidak ada data karyawan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default EmployeeManagement;
