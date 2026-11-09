const ExcelJS = require('exceljs');

async function buildAttendanceWorkbook(attendanceList) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rekap Absensi');

  worksheet.mergeCells('A1:K1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'LAPORAN REKAPITULASI ABSENSI KARYAWAN';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F4E78' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  const headerRow = worksheet.addRow([
    'NIK', 'Nama Karyawan', 'Departemen', 'Tanggal',
    'Jam Masuk', 'Jam Keluar', 'Status', 'Lembur (Jam)',
    'Latitude Check-in', 'Longitude Check-in', 'Akurasi GPS (meter)'
  ]);
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F5597' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.height = 32;

  attendanceList.forEach((item, index) => {
    const row = worksheet.addRow([
      item.nik,
      item.full_name,
      item.department_name || '-',
      new Date(item.date).toLocaleDateString('id-ID'),
      item.clock_in || '-',
      item.clock_out || '-',
      item.status.toUpperCase(),
      item.overtime_hours || 0,
      item.checkin_latitude ?? '-',
      item.checkin_longitude ?? '-',
      item.checkin_accuracy_meters ?? '-'
    ]);
    if (index % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FBFD' } };
    }
    row.alignment = { vertical: 'middle' };
  });

  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value ? cell.value.toString().length : 10;
      if (len > maxLength) maxLength = len;
    });
    column.width = Math.min(Math.max(maxLength + 4, 12), 32);
  });

  worksheet.views = [{ state: 'frozen', ySplit: 2 }];
  worksheet.autoFilter = { from: 'A2', to: 'K2' };
  return workbook;
}

module.exports = { buildAttendanceWorkbook };
