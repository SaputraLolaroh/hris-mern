import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../api/axios.js';
import AppLayout from '../components/AppLayout.jsx';
import { formatRupiah, statusColor } from '../utils/helpers.js';

function PayrollReport() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/payrolls/report?month=${month}&year=${year}`);
      if (response.data.success) setPayrolls(response.data.data);
    } catch (err) {
      console.error('Gagal memuat laporan gaji:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayrollData(); }, [month, year]);

  // Unduh slip gaji PDF langsung dari browser (jsPDF)
  const downloadPayslipPDF = (employee) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PT. INOVASI TEKNOLOGI NUSANTARA', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Jl. Sudirman No. 45, Jakarta Selatan', 14, 26);
    doc.text('Email: hr@inovasiteknologi.co.id', 14, 31);
    doc.setLineWidth(0.5);
    doc.line(14, 36, 196, 36);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SLIP GAJI KARYAWAN', 14, 46);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${employee.period_month}/${employee.period_year}`, 14, 52);

    doc.autoTable({
      startY: 58,
      theme: 'plain',
      body: [
        ['NIK', `: ${employee.nik}`, 'Departemen', `: ${employee.department_name}`],
        ['Nama Lengkap', `: ${employee.full_name}`, 'Jabatan', `: ${employee.position}`],
        ['Status Payroll', `: ${employee.payroll_status.toUpperCase()}`, 'Tanggal Cetak', `: ${new Date().toLocaleDateString('id-ID')}`]
      ],
      styles: { fontSize: 10, cellPadding: 2 }
    });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Komponen Pendapatan', 'Jumlah (IDR)']],
      body: [
        ['Gaji Pokok', formatRupiah(employee.base_salary)],
        ['Tunjangan', formatRupiah(employee.allowance || 0)],
        ['Uang Lembur', formatRupiah(employee.overtime_pay || 0)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 }
    });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 5,
      theme: 'plain',
      body: [['TOTAL POTONGAN', formatRupiah(employee.deductions || 0)]],
      styles: { fontSize: 10 }
    });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 5,
      theme: 'plain',
      body: [['TOTAL GAJI BERSIH (NET)', formatRupiah(employee.net_salary)]],
      styles: { fontSize: 11, fontStyle: 'bold' }
    });

    const finalY = doc.lastAutoTable.finalY + 25;
    doc.setFontSize(10);
    doc.text('Disetujui oleh,', 14, finalY);
    doc.text('Penerima,', 140, finalY);
    doc.text('HR Department', 14, finalY + 25);
    doc.text(`(${employee.full_name})`, 140, finalY + 25);

    doc.save(`Slip_Gaji_${employee.nik}_${employee.period_month}_${employee.period_year}.pdf`);
  };

  // Unduh slip via Presigned URL S3 (jika file sudah tersimpan di bucket)
  const handleDownloadFromS3 = async (payslipUrl) => {
    try {
      const fileName = payslipUrl.split('.com/')[1]; // ekstrak key dari URL S3
      const response = await api.get(`/payrolls/download-token?filename=${encodeURIComponent(fileName)}`);
      if (response.data.success) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (err) {
      alert('Gagal mendapatkan izin unduh dokumen.');
    }
  };

  return (
    <AppLayout title="Laporan Gaji Karyawan">
      <div className="card" style={{ display: 'flex', gap: 15, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label className="f-label">Bulan</label>
          <select className="input" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Bulan {i + 1}</option>)}
          </select>
        </div>
        <div>
          <label className="f-label">Tahun</label>
          <input className="input" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ width: 120 }} />
        </div>
        <button className="btn btn-success" onClick={fetchPayrollData}>🔄 Muat Ulang</button>
      </div>

      <div className="card">
        {loading ? <p className="muted">Sedang memuat data laporan...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr><th>NIK</th><th>Nama Lengkap</th><th>Departemen</th><th>Jabatan</th><th>Gaji Pokok</th><th>Gaji Bersih</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {payrolls.length > 0 ? payrolls.map((item, index) => (
                  <tr key={index}>
                    <td>{item.nik}</td>
                    <td>{item.full_name}</td>
                    <td>{item.department_name}</td>
                    <td>{item.position}</td>
                    <td>{formatRupiah(item.base_salary)}</td>
                    <td><strong>{formatRupiah(item.net_salary)}</strong></td>
                    <td><span className="badge" style={{ backgroundColor: statusColor(item.payroll_status) }}>{item.payroll_status.toUpperCase()}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button className="btn btn-success" style={{ padding: '6px 10px' }} onClick={() => downloadPayslipPDF(item)}>📥 Unduh PDF</button>
                        {item.payslip_url && (
                          <button className="btn btn-primary" style={{ padding: '6px 10px' }} onClick={() => handleDownloadFromS3(item.payslip_url)}>☁️ S3</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="8" style={{ textAlign: 'center' }} className="muted">Tidak ada data laporan untuk periode {month}/{year}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default PayrollReport;
