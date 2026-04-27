import { useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { RiLogoutBoxRLine, RiFileList3Line, RiDashboardLine } from "react-icons/ri";
import { IoSettingsSharp } from "react-icons/io5";
import { MdOutlineBusiness } from "react-icons/md";
import { TbReportSearch } from "react-icons/tb";

import { useIsMobile } from "@/utils/useIsMobile";
import AdminSidebarLink from "./components/AdminSidebarLink";
import { defaultSidebarLabels } from "@/constants/adminSidebarLabels";
import "./style.scss";

const Sidebar = ({ isCollapsed, onToggleCollapse, isOpenOnMobile, onCloseOnMobile }) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const sidebarLabels = defaultSidebarLabels;

  const adminSidebarData = [
    { to: "/admin/dashboard", label: sidebarLabels.Dashboard, Icon: RiDashboardLine },
    { to: "/admin/tenant", label: "Tenant", Icon: MdOutlineBusiness },
    { to: "/admin/custom-pages", label: "Custom Pages", Icon: RiFileList3Line },
    { to: "/admin/reports", label: sidebarLabels.reports, Icon: TbReportSearch },
    { to: "/admin/settings", label: sidebarLabels.settings, Icon: IoSettingsSharp },
  ];

  const handleLogout = () => {
    localStorage.clear();
    queryClient.clear();
    navigate("/login");
  };

  const handleLinkClick = () => {
    if (isMobile && onCloseOnMobile) onCloseOnMobile();
  };

  const showLabels = isMobile || !isCollapsed;

  const renderNavItems = (items) => {
    return items.map((item) => (
      <li key={item.to}>
        <AdminSidebarLink
          to={item.to}
          label={item.label}
          icon={<item.Icon size={26} />}
          showLabel={showLabels}
          onClick={handleLinkClick}
        />
      </li>
    ));
  };

  return (
    <>
      {isMobile && isOpenOnMobile && (
        <div className="admin_sidebar-backdrop box-shadow" onClick={onCloseOnMobile} />
      )}
      <aside
        className={`admin-sidebar ${
          !isMobile && isCollapsed ? "collapsed" : ""
        } ${isMobile && isOpenOnMobile ? "mobile-open" : ""}`}
      >
        <nav className="admin-sidebar__nav fs16 fw600">
          <ul>{renderNavItems(adminSidebarData)}</ul>
        </nav>

        <div
          className="admin-sidebar__logout fs16 fw600"
          onClick={handleLogout}
          title="Logout"
        >
          <span className="admin-sidebar__logout-icon">
            <RiLogoutBoxRLine size={26} />
          </span>
          {showLabels && (
            <span className="admin-sidebar__logout-label">Logout</span>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
