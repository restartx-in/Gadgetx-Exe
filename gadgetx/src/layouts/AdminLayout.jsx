import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { UserProvider } from "@/apps/user/context/user.context";
import Sidebar from "@/apps/admin/components/Sidebar";
import HeaderBar from "@/apps/admin/components/HeaderBar";
import { useIsMobile } from "@/utils/useIsMobile";
import useBgColor from "@/hooks/styles/useBgColor";
import adminRoutes from "@/apps/admin/Routes/adminRoutes"; // <--- MAKE SURE THIS IMPORT IS CORRECT

export default function AdminLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const isBodyHaveBg = useBgColor();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  function getHeight(screenWidth, isMobile) {
    let headerHeight;
    if (screenWidth >= 1350) headerHeight = 70;
    else if (screenWidth >= 1200) headerHeight = 72;
    else if (screenWidth >= 900) headerHeight = 65;
    else if (screenWidth >= 750) headerHeight = 60;
    else headerHeight = 60;

    let bottomBarHeight = isMobile ? 0 : 0;
    let bodyHeight = `calc(100vh - ${headerHeight + bottomBarHeight}px)`;

    return {
      headerHeight: `${headerHeight}px`,
      bodyHeight,
      bottomBarHeight: `${bottomBarHeight}px`,
    };
  }

  const [height, setHeight] = useState(getHeight(window.innerWidth, isMobile));

  useEffect(() => {
    const handleResize = () => {
      setHeight(getHeight(window.innerWidth, isMobile));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  return (
    <UserProvider>
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "var(--color-bg)",
        }}
      >
        <div
          style={{
            width: "fit-content",
            minHeight: "100vh",
            overflow: "hidden",
          }}
        >
          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isCollapsed={isCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        </div>

        <div
          style={{
            flex: 1,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            overflowY: "hidden",
          }}
        >
          <div style={{ width: "100%", height: height.headerHeight }}>
            <HeaderBar
              onMenuClick={() => setSidebarOpen(!sidebarOpen)}
              isCollapsed={isCollapsed}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            <Routes>
              {adminRoutes.map((route, idx) => (
                <Route key={idx} path={route.path} element={route.element} />
              ))}
            </Routes>
          </div>

        </div>
      </div>
    </UserProvider>
  );
}