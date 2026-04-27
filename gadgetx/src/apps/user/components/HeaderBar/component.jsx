import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";
import "./style.scss";

import { FaUser } from "react-icons/fa";
import { RiMenuFold3Line, RiMenuFold4Line } from "react-icons/ri";
import { FiUser, FiSettings, FiLogOut, FiSearch } from "react-icons/fi";

import useFetchSettings from "@/apps/user/hooks/api/settings/useFetchSettings";
import useLogout from "@/apps/user/hooks/useLogout";
import FullScreenButton from "@/components/FullScreenButton";
import userRoutes from "@/apps/user/routes/userRoutes";

const HeaderBar = ({
  brandName = "MyApp",
  brandLogo = "src/assets/user/brandlogo.png",
  pageTitle,
  onMenuClick,
  isCollapsed,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // 🔍 SEARCH STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // 📱 RESPONSIVE STATE (To detect mobile/desktop)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const navigate = useNavigate();

  const { data: userSettings } = useFetchSettings();
  const { logout } = useLogout();

  // 🔍 Generate searchable routes
  const searchablePages = useMemo(() => {
    return userRoutes
      .filter((route) => {
        const path = route.path;
        if (!path) return false;

        return (
          !path.includes(":") &&
          !path.toLowerCase().includes("/add") &&
          !path.toLowerCase().includes("/edit")
        );
      })
      .map((route) => ({
        label:
          route.path === "/"
            ? "Dashboard"
            : route.path
                .replace("/", "")
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase()),
        path: route.path,
      }));
  }, []);

  const filteredResults = useMemo(() => {
    if (!searchQuery) return [];
    return searchablePages.filter((p) =>
      p.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, searchablePages]);

  // 🔥 SHORTCUTS
  useHotkeys("f5", (e) => {
    e.preventDefault();
    navigate("/pos");
  });

  useHotkeys("ctrl+k", (e) => {
    if (isMobile) return; // Disable shortcut on mobile
    e.preventDefault();
    searchInputRef.current?.focus();
  });

  useHotkeys("ctrl+b", (e) => {
    e.preventDefault();
    onMenuClick();
  });

  // 🔍 Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSearch || filteredResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < filteredResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : filteredResults.length - 1
      );
    } else if (e.key === "Enter") {
      const selected =
        activeIndex >= 0 ? filteredResults[activeIndex] : filteredResults[0];
      if (selected) handleSelect(selected.path);
    } else if (e.key === "Escape") {
      setShowSearch(false);
    }
  };

  const handleSelect = (path) => {
    navigate(path);
    setSearchQuery("");
    setShowSearch(false);
    setActiveIndex(-1);
  };

  // Resize listener and Close dropdown + search
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setShowDropdown(false);
      }
      if (!searchRef.current?.contains(e.target)) {
        setShowSearch(false);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const dropdownItems = [
    {
      icon: <FiUser size={16} />,
      label: "Profile",
      action: () => navigate("/settings"),
    },
    {
      icon: <FiSettings size={16} />,
      label: "Settings",
      action: () => navigate("/settings"),
    },
    {
      icon: <FiLogOut size={16} />,
      label: "Logout",
      action: logout,
    },
  ];

  return (
    <header className="header-bar">
      {/* LEFT */}
      <div className="header-bar__left-section">
        <button
          className="header-bar__left-section-menu-btn"
          onClick={onMenuClick}
        >
          {isCollapsed ? (
            <RiMenuFold4Line size={22} />
          ) : (
            <RiMenuFold3Line size={22} />
          )}
        </button>

        <div className="header-bar__left-section-brand">
          {brandLogo && (
            <img
              src={brandLogo}
              alt="src/assets/user/brand-logo"
              className="header-bar__left-section-brand-logo"
            />
          )}
          <span className="header-bar__left-section-brand-name">
            {brandName}
          </span>
        </div>

        <span className="header-bar__left-section-page-title">
          {pageTitle}
        </span>
      </div>

      {/* RIGHT */}
      <div className="header-bar__right-section">
        
        {/* 🔍 SEARCH UI - Desktop Only */}
        {!isMobile && (
          <div className="header-bar__search" ref={searchRef}>
            <div className="header-bar__search-container">
              <FiSearch />
              <input
                ref={searchInputRef}
                placeholder="Search... (Ctrl + K)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
                onKeyDown={handleKeyDown}
                className="header-bar__search-input"
              />
            </div>

            {showSearch && filteredResults.length > 0 && (
              <ul className="header-bar__search-results">
                {filteredResults.map((item, index) => (
                  <li
                    key={index}
                    className={`header-bar__search-results-item ${
                      activeIndex === index
                        ? "header-bar__search-results-item--active"
                        : ""
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(item.path)}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 📺 FULL SCREEN BUTTON - Desktop Only */}
        {!isMobile && <FullScreenButton />}

        <Link
          to="/pos"
          className="header-bar__pos-button"
          data-tooltip="Shortcut: F5"
        >
          POS
        </Link>

        <div
          className="header-bar__right-section-user-dropdown"
          ref={dropdownRef}
        >
          <button
            className="header-bar__right-section-user-dropdown-trigger"
            onClick={() => setShowDropdown((prev) => !prev)}
          >
            <FaUser size={18} />
          </button>

          {showDropdown && (
            <ul className="header-bar__right-section-user-dropdown-menu">
              {dropdownItems.map((item, index) => (
                <li
                  key={index}
                  className="header-bar__right-section-user-dropdown-menu-item"
                  onClick={() => {
                    item.action();
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

export default HeaderBar; 