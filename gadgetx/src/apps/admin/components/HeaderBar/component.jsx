import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "./style.scss";

import useBgColor from "@/hooks/styles/useBgColor";
import { FaUser } from "react-icons/fa";
import { RxHamburgerMenu } from "react-icons/rx";
import { FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import useLogout from "@/hooks/useLogout";
const HeaderBar = ({ onMenuClick }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Custom hook to determine background color based on body style
  const isBodyHaveBg = useBgColor();
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

  // Dropdown menu items defined in an array for easy maintenance
  const dropdownItems = [
    {
      icon: <FiUser size={16} />,
      label: "Profile",
      onClick: () => navigate("/profile"),
    },
    {
      icon: <FiSettings size={16} />,
      label: "Settings",
      onClick: () => navigate("/settings"),
    },
    {
      icon: <FiLogOut size={16} />,
      label: "Logout",
      onClick: logout,
    },
  ];

  return (
    <header
      style={{
        backgroundColor: isBodyHaveBg ? "white" : "var(--color-bg)",
      }}
      className="admin-header-bar pr10 pl30"
    >
      <div className="admin-header-bar__left-section gap18">
        <button
          className="admin-header-bar__menu-btn"
          onClick={onMenuClick}
          aria-label="Open sidebar menu"
        >
          <RxHamburgerMenu size={26} color={"var(--sidbar-bg)"} />
        </button>
        <span className="admin-header-bar__title fs20 fw600">Admin Panel</span>
      </div>

      <div className="admin-header-bar__right-section">
        <div
          className="header-bar__right-section-user-dropdown"
          ref={dropdownRef}
        >
          <button
            className="header-bar__right-section-user-dropdown-trigger"
            onClick={() => setShowDropdown((prev) => !prev)}
            aria-label="Open user menu"
          >
            <FaUser size={20} />
          </button>

          {showDropdown && (
            <ul
              className="header-bar__right-section-user-dropdown-menu fs15"
              role="menu"
            >
              {dropdownItems.map((item, index) => (
                <li
                  key={index}
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
};

export default HeaderBar;
