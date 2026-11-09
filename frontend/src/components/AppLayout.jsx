import { useNavigate, useLocation } from 'react-router-dom';
import LogoutButton from './LogoutButton.jsx';
import { getUserRoleFromToken } from '../utils/helpers.js';

function AppLayout({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHrAdmin = getUserRoleFromToken() === 'HR_ADMIN';

  const menu = [
    { path: '/dashboard', label: '📊 Dashboard' },
    { path: '/attendance', label: '🕒 Absensi' },
    ...(isHrAdmin ? [{ path: '/attendance/management', label: '📍 Manajemen Absensi' }] : []),
    { path: '/leaves', label: '📋 Cuti' },
    ...(isHrAdmin ? [
      { path: '/employees', label: '👥 Karyawan (HR)' },
      { path: '/payrolls/report', label: '💰 Payroll (HR)' }
    ] : [])
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">🏢 HRIS Enterprise</div>
        <ul>
          {menu.map((item) => (
            <li
              key={item.path}
              className={location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/')) ? 'active' : ''}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          Logged in as: <strong>{isHrAdmin ? 'HR Administrator' : 'Employee'}</strong>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <span>🔔 Notifikasi</span>
            <LogoutButton />
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
