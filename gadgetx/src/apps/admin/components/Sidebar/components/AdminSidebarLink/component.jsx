import { NavLink, useLocation } from 'react-router-dom';
import './style.scss';

const AdminSidebarLink = ({ to, icon, label, end = false, showLabel = true, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive: navActive }) =>
        `admin-sidebar-link ${(isActive || navActive) ? "active" : ""}`
      }
      title={label}
    >
      <span className="admin-sidebar-link__icon">
        {icon}
      </span>
      {showLabel && (
        <span className="admin-sidebar-link__label">{label}</span>
      )}
    </NavLink>
  );
};

export default AdminSidebarLink;