import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "@/apps/admin/components/Sidebar";
import HeaderBar from "@/apps/admin/components/HeaderBar";
import { useIsMobile } from "@/utils/useIsMobile";
import adminRoutes from "@/apps/admin/Routes/adminRoutes";

// Utility function to calculate heights based on Gadget/Physique layout
function getHeight(isMobile) {
  const headerHeight = "60px"; // Admin header height
  const bottomBarHeight = "0px"; // Usually 0 for Admin unless you add a mobile bottom nav

  const bodyHeight = `calc(100vh - ${headerHeight} - ${bottomBarHeight})`;

  return {
    headerHeight,
    bodyHeight,
    bottomBarHeight,
  };
}

export default function AdminLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();

  // State for sidebar control
  const [sidebarOpenOnMobile, setSidebarOpenOnMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State for dynamic heights
  const [heights, setHeights] = useState(getHeight(isMobile));

  // 1. Height Update Logic
  useEffect(() => {
    setHeights(getHeight(isMobile));
  }, [isMobile]);

  // 2. Mobile Sidebar Cleanup (Close on navigation)
  useEffect(() => {
    setSidebarOpenOnMobile(false);
  }, [location.pathname]);

  // 3. Auto-Collapse Logic (runs on resize)
  useEffect(() => {
    const handleResize = () => {
      // Auto-collapse: If desktop and width <= 1300px, collapse sidebar
      if (!isMobile) {
        if (window.innerWidth <= 1300) {
          setIsCollapsed(true);
        } else {
          setIsCollapsed(false);
        }
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // 4. Manual Toggle Handler
  const handleToggleCollapse = useCallback(() => {
    if (isMobile) {
      setSidebarOpenOnMobile((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  // --- Styles ---
  const layoutStyle = {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#121212", // Matches new dark surface theme
    overflow: "hidden",
  };

  const headerContainerStyle = {
    width: "100%",
    height: heights.headerHeight,
  };

  const bodyStyle = {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    height: heights.bodyHeight,
  };

  const mainContentStyle = {
    flex: 1,
    padding: isMobile ? "16px" : "24px",
    backgroundColor:"white", 
    overflowY: "auto",
    borderTopLeftRadius: isMobile ? "0" : "24px" , 
    transition: "all 0.3s ease",
  };

  return (
    <div style={layoutStyle}>
      {/* Header */}
      <div style={headerContainerStyle}>
        <HeaderBar
          brandName="Admin Panel"
          onMenuClick={handleToggleCollapse}
          isCollapsed={isCollapsed}
          pageTitle=""
        />
      </div>

      {/* Body Section */}
      <div style={bodyStyle}>
        <Sidebar
          isCollapsed={isCollapsed && !isMobile}
          isOpenOnMobile={sidebarOpenOnMobile}
          onCloseOnMobile={() => setSidebarOpenOnMobile(false)}
        />
        
        <main style={mainContentStyle}>
          <Routes>
            {adminRoutes.map((route, idx) => (
              <Route key={idx} path={route.path} element={route.element} />
            ))}
          </Routes>
        </main>
      </div>
    </div>
  );
}