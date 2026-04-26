import { NavLink } from 'react-router-dom';
import './style.scss';

const AdminSidebarLink = ({ to, icon, label, end = false }) => {
  return (
    <div className='admin_sidebar_link'>
    <li className="admin_sidebar_link__item">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => "admin_sidebar_link__item-link fs16" + (isActive ? " active" : "")}
      >
        <span className="admin_sidebar_link__item-link-icon">{icon}</span>
        <span className="admin_sidebar_link__item-link-label">{label}</span>
      </NavLink>
    </li>
    </div>
  );
};

export default AdminSidebarLink;