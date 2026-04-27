import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { IoAdd } from "react-icons/io5";
import "./style.scss";

const SidebarLink = ({
  to,
  title,
  Icon,
  label,
  showLabel,
  isChild,
  addPath,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isQueryLink = to.includes("?");

  const isActive = isQueryLink
    ? location.pathname + location.search === to
    : location.pathname === to;

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (addPath) navigate(addPath);
  };

  return (
    <NavLink
      to={to}
      className={({ isActive: navActive }) =>
        `gadgetx-sidebar-link
         ${isChild ? "is-child" : ""}
         ${(isQueryLink ? isActive : navActive) ? "active" : ""}`
      }
      title={title}
    >
      <span className="gadgetx-sidebar-link__icon">
        <Icon size={26} />
      </span>

      {showLabel && (
        <>
          <span className="gadgetx-sidebar-link__label">{label}</span>
          {addPath && (
            <span
              className="gadgetx-sidebar-link__add-icon"
              onClick={handleAddClick}
            >
              <IoAdd size={20} />
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

export default SidebarLink;
