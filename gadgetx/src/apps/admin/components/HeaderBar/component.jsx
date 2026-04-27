import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "./style.scss";

import { FaUser } from "react-icons/fa";
import { RiMenuFold3Line, RiMenuFold4Line } from "react-icons/ri";
import { FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import useLogout from "@/apps/user/hooks/useLogout";

const HeaderBar = ({ onMenuClick, isCollapsed }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { logout } = useLogout();

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dropdown menu items
  const dropdownItems = [
    {
      icon: <FiUser size={16} />,
      label: "Profile",
      onClick: () => navigate("/admin/settings"),
    },
    {
      icon: <FiSettings size={16} />,
      label: "Settings",
      onClick: () => navigate("/admin/settings"),
    },
    {
      icon: <FiLogOut size={16} />,
      label: "Logout",
      onClick: logout,
    },
  ];

  return (
    <header className="admin-header-bar">
      <div className="admin-header-bar__left-section">
        <button
          className="admin-header-bar__left-section-menu-btn"
          onClick={onMenuClick}
        >
          {isCollapsed ? (
            <RiMenuFold4Line size={22} />
          ) : (
            <RiMenuFold3Line size={22} />
          )}
        </button>

        <div className="admin-header-bar__left-section-brand">
          <span className="admin-header-bar__left-section-brand-name">
            Admin Panel
          </span>
        </div>
      </div>

      <div className="admin-header-bar__right-section">
        <div
          className="admin-header-bar__right-section-user-dropdown"
          ref={dropdownRef}
        >
          <button
            className="admin-header-bar__right-section-user-dropdown-trigger"
            onClick={() => setShowDropdown((prev) => !prev)}
            aria-label="Open user menu"
          >
            <FaUser size={18} />
          </button>

          {showDropdown && (
            <ul className="admin-header-bar__right-section-user-dropdown-menu">
              {dropdownItems.map((item, index) => (
                <li
                  key={index}
                  className="admin-header-bar__right-section-user-dropdown-menu-item"
                  onClick={() => {
                    item.onClick();
                    setShowDropdown(false);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
};

HeaderBar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool,
};

export default HeaderBar;
