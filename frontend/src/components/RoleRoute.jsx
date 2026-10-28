import { Navigate, Outlet } from 'react-router-dom';
import { getUserRoleFromToken } from '../utils/helpers.js';

// Role-Based Route: pengguna harus login DAN rolenya ada di allowedRoles
function RoleRoute({ allowedRoles }) {
  const token = localStorage.getItem('jwt_token');
  const userRole = getUserRoleFromToken();

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}

export default RoleRoute;
