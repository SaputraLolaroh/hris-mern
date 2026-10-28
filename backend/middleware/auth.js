const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kunci_rahasia_sangat_aman_123';

// Middleware satpam: verifikasi JWT pada header Authorization: Bearer <token>
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan. Harap login terlebih dahulu.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token tidak valid atau sudah kedaluwarsa.'
      });
    }
    req.user = decodedUser; // { id, name, role, ... }
    next();
  });
}

// Middleware RBAC: hanya izinkan peran tertentu (contoh: checkRole('HR_ADMIN'))
function checkRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Anda tidak memiliki hak akses untuk modul ini.'
      });
    }
    next();
  };
}

module.exports = { verifyToken, checkRole, JWT_SECRET };
