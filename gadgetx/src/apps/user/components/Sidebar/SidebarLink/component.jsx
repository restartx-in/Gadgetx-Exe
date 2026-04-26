import { NavLink } from "react-router-dom";
import "./style.scss";

const SidebarLink = ({ to, title, Icon, label, showLabel }) => {
  return (
    <NavLink to={to} className="sidebar-link" title={title}>
      <span className="sidebar-link__icon">
        <Icon size={26} />
      </span>
      {showLabel && <span className="sidebar-link__label">{label}</span>}
    </NavLink>
  );
};

export default SidebarLink;
