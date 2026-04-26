import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./style.scss";
import { FaUser } from "react-icons/fa";
import { RiMenuFold3Line, RiMenuFold4Line } from "react-icons/ri";
import { FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import useFetchSettings from "@/hooks/api/settings/useFetchSettings";
import useLogout from "@/hooks/useLogout";

const HeaderBar = ({
  brandName = "MyApp",
  brandLogo = null,
  pageTitle,
  onMenuClick,
  isCollapsed,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const {
    data: userSettings,
    isLoading,
    error,
    refetch: refetchSettings,
  } = useFetchSettings();
  const { logout } = useLogout();

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout

  // Dropdown menu items
  const dropdownItems = [
    {
      icon: <FiUser size={16} />,
      label: "Profile",
      onClick: () => navigate("/settings"),
    },
    {
      icon: <FiSettings size={16} />,
      label: "Settings",
      onClick: () => navigate("/settings"),
    },
    { icon: <FiLogOut size={16} />, label: "Logout", onClick: logout },
  ];

  return (
    <div className="header-bar">
      {/* LEFT SECTION */}
      <div className="header-bar__left-section">
        <button
          className="header-bar__left-section-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle sidebar menu"
        >
          {isCollapsed ? (
            <RiMenuFold4Line size={24} />
          ) : (
            <RiMenuFold3Line size={24} />
          )}
        </button>

        <div className="header-bar__left-section-brand">
          {brandLogo && (
            <img
              src={brandLogo}
              alt={`${brandName} Logo`}
              className="header-bar__left-section-brand-logo"
            />
          )}
          <span className="header-bar__left-section-brand-name fs26">
            {brandName}
          </span>
        </div>
        <span className="header-bar__left-section-page-title fs18">
          {pageTitle}
        </span>
      </div>

      {/* RIGHT SECTION */}
      <div className="header-bar__right-section">
        <span className="header-bar__left-section-brand-name fs20">
          {userSettings?.app_name}
        </span>
        <Link to="/pos" className="header-bar__pos-button fs12 fw400">
          POS
        </Link>

        <div
          className="header-bar__right-section-user-dropdown"
          ref={dropdownRef}
        >
          <button
            className="header-bar__right-section-user-dropdown-trigger"
            onClick={() => setShowDropdown((prev) => !prev)}
            aria-label="Open user menu"
            aria-expanded={showDropdown}
          >
            <FaUser size={20} />
          </button>

          {showDropdown && (
            <ul
              className="header-bar__right-section-user-dropdown-menu"
              role="menu"
            >
              {dropdownItems.map((item, index) => (
                <li
                  key={index}
                  className="header-bar__right-section-user-dropdown-menu-item fs16"
                  onClick={() => {
                    item.onClick();
                    setShowDropdown(false);
                  }}
                  role="menuitem"
                  tabIndex="-1"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderBar;
