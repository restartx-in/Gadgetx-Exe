import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { UserProvider } from "@/context/user.context";
import Sidebar from "@/apps/user/components/Sidebar";
import HeaderBar from "@/apps/user/components/HeaderBar";
import POS from "@/apps/user/pages/POS";
import { useIsMobile } from "@/utils/useIsMobile";
import userRoutes from "@/apps/user/routes/userRoutes";

import "./style.scss";

export default function GadgetxLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();

  const [sidebarOpenOnMobile, setSidebarOpenOnMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // detect if current route is POS
  const isPOSPage = location.pathname === "/pos";

  useEffect(() => {
    setSidebarOpenOnMobile(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (!isMobile) {
        setIsCollapsed(window.innerWidth <= 1300);
      }
    };
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  const handleToggleCollapse = () => {
    if (isMobile) {
      setSidebarOpenOnMobile((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const layoutStyle = {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "var(--navy)",
  };

  const bodyStyle = {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  };

  const contentStyle = {
    flex: 1,
    padding: isPOSPage ? "0px" : "12px", // no padding for POS
    backgroundColor: "white",
    overflowY: "auto",
    borderTopLeftRadius: isPOSPage ? "0px" : "24px", // flat layout for POS
  };

  return (
    <UserProvider>
        {isPOSPage ? (
          /* Render POS page separately — no sidebar or header */
          <main style={{ height: "100vh", background: "#fff" }}>
            <POS />
          </main>
        ) : (
          /* Standard Layout */
          <div style={layoutStyle}>
            <HeaderBar
              brandName="InventoryX"
              onMenuClick={handleToggleCollapse}
              isCollapsed={isCollapsed}
            />
            <div style={bodyStyle}>
              <Sidebar
                isCollapsed={isCollapsed && !isMobile}
                isOpenOnMobile={sidebarOpenOnMobile}
                onCloseOnMobile={() => setSidebarOpenOnMobile(false)}
              />
              <main style={contentStyle}>
                <Routes>
                  {userRoutes.map((route, idx) => (
                    <Route
                      key={idx}
                      path={route.path}
                      element={route.element}
                    />
                  ))}
                </Routes>
              </main>
            </div>
          </div>
        )}
    </UserProvider>
  );
}