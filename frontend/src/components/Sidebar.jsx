import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid, FiFolder, FiCheckSquare, FiUsers,
  FiLogOut, FiZap, FiShield
} from 'react-icons/fi';

const navItems = [
  { to: '/dashboard', icon: <FiGrid />, label: 'Dashboard' },
  { to: '/projects', icon: <FiFolder />, label: 'Projects' },
  { to: '/tasks', icon: <FiCheckSquare />, label: 'My Tasks' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon"><FiZap /></div>
        <span className="brand-name">TaskFlow</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className={`user-role ${user?.role}`}>
              {user?.role === 'admin' ? <><FiShield size={10} /> Admin</> : 'Member'}
            </span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <FiLogOut />
        </button>
      </div>
    </aside>
  );
}
