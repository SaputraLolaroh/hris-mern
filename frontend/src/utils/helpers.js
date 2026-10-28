// Format angka ke mata uang Rupiah
export const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);

// Warna badge berdasarkan status
export const statusColor = (status) => {
  const map = {
    paid: 'green',
    approved: 'green',
    active: 'green',
    present: 'green',
    draft: '#6c757d',
    pending: '#ffc107',
    late: '#ffc107',
    rejected: '#dc3545',
    resigned: '#dc3545',
    suspended: '#dc3545',
    alpha: '#dc3545'
  };
  return map[status] || '#6c757d';
};

// Dekode payload JWT (bagian tengah) untuk membaca role
export const getUserRoleFromToken = () => {
  const token = localStorage.getItem('jwt_token');
  if (!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    return JSON.parse(atob(payloadBase64)).role;
  } catch {
    return null;
  }
};
