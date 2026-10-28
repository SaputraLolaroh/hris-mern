import { Navigate, Outlet } from 'react-router-dom';

// Private Route: hanya pengguna dengan token JWT yang boleh masuk
function ProtectedRoute() {
  const isAuthenticated = localStorage.getItem('jwt_token');
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
