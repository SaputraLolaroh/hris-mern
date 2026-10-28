import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import EmployeeManagement from './pages/EmployeeManagement.jsx';
import AttendanceForm from './pages/AttendanceForm.jsx';
import LeaveManagement from './pages/LeaveManagement.jsx';
import PayrollReport from './pages/PayrollReport.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import NotFound from './pages/NotFound.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman publik */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Halaman member: semua yang sudah login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/attendance" element={<AttendanceForm />} />
          <Route path="/leaves" element={<LeaveManagement />} />
        </Route>

        {/* Halaman khusus HR_ADMIN */}
        <Route element={<RoleRoute allowedRoles={['HR_ADMIN']} />}>
          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/payrolls/report" element={<PayrollReport />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
