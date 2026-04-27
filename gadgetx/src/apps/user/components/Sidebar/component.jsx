import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/utils/axios/api";
import { HiArrowsExpand } from "react-icons/hi";
import {
  RiLogoutBoxRLine,
  RiBillFill,
  RiUserAddFill,
  RiFileList3Line,
  RiArrowUpSLine,
  RiArrowDownSLine,
  RiMenuFold3Line,
  RiMenuFold4Line,
  RiRuler2Line,
} from "react-icons/ri";
import { IoSettingsSharp } from "react-icons/io5";
import {
  MdDashboard,
  MdShoppingBag,
  MdPeopleAlt,
  MdPayments,
  MdBrandingWatermark,
  MdCategory,
  MdAccountBalance,
  MdOutlineInventory,
  MdInventory,
  MdOutlinePointOfSale,
} from "react-icons/md";

import { CiShop } from "react-icons/ci";
import { GrUserWorker } from "react-icons/gr";
import {
  FaShoppingCart,
  FaStoreAlt,
  FaCashRegister,
  FaSun,
  FaChartLine,
  FaBalanceScale,
  FaFileInvoiceDollar,
  FaReceipt,
} from "react-icons/fa";

import { BsReceipt } from "react-icons/bs";
import { MdReceipt } from "react-icons/md";
import { LuReceipt, LuReceiptCent } from "react-icons/lu";
import { TbFileReport } from "react-icons/tb";

import { RiReceiptFill } from "react-icons/ri";
import { IoPerson, IoManSharp } from "react-icons/io5";
import { LuFileSpreadsheet } from "react-icons/lu";
import { BiSolidUser } from "react-icons/bi";
import { TbTruckReturn } from "react-icons/tb";
import { useIsMobile } from "@/utils/useIsMobile";
import { HiShoppingBag } from "react-icons/hi2";
import SidebarLink from "./SidebarLink";
import "./style.scss";
import { add } from "date-fns";

const sidebarData = [
  // ===== DASHBOARD =====
  { to: "/", title: "Dashboard", label: "Dashboard", Icon: MdDashboard },
  // {
  //   to: "/prescription-list",
  //   title: "Prescription List",
  //   label: "Prescriptions",
  //   Icon: LuFileSpreadsheet,
  //   addPath: "/prescription-list?action=add",
  // },

  // ===== SALES & BILLING =====
  {
    category: "Sales",
    icon: <MdOutlinePointOfSale size={26} />,
    items: [
      {
        to: "/sale-report",
        title: "Sales Report",
        label: "Sales",
        Icon: FaShoppingCart,
        addPath: "/sale/add",
      },
      // {
      //   to: "/sale-return-report",
      //   title: "Sales Return",
      //   label: "Returns",
      //   Icon: TbTruckReturn,
      //   addPath: "/sale-return/add",
      // },
    ],
  },

  // ===== PURCHASE & STOCK =====
  {
    category: "purchase",
    icon: <HiShoppingBag size={26} />,
    items: [
      {
        to: "/purchase-report",
        title: "Purchase Report",
        label: "Purchases",
        Icon: MdShoppingBag,
        addPath: "/purchase/add",
      },
      // {
      //   to: "/purchase-return-report",
      //   title: "Purchase Return",
      //   label: "Purchase Returns",
      //   Icon: TbTruckReturn,
      //   addPath: "/purchase-return/add",
      // },
    ],
  },
  // ===== PATIENT MANAGEMENT =====
  {
    category: "Contacts",
    icon: <IoPerson size={26} />,
    items: [
      {
        to: "/customer-list",
        title: "Customer Report",
        label: "Customers",
        Icon: IoPerson,
        addPath: "/customer-list?action=add",
      },
      {
        to: "/suppliers-list",
        title: "Supplier Report",
        label: "Suppliers",
        Icon: IoManSharp,
        addPath: "/suppliers-list?action=add",
      },
    ],
  },

  // ===== PRODUCTS =====
  {
    category: "Items",
    icon: <FaStoreAlt size={26} />,
    items: [
      {
        to: "/item-list",
        title: "Item List",
        label: "Items",
        Icon: MdInventory,
        addPath: "/item-list?action=add",
      },
      {
        to: "/brand-list",
        title: "Brand List",
        label: "Brands",
        Icon: MdBrandingWatermark,
        addPath: "/brand-list?action=add",
      },
      {
        to: "/category-list",
        title: "Category List",
        label: "Categories",
        Icon: MdCategory,
        addPath: "/category-list?action=add",
      },
    ],
  },

  // ===== ACCOUNTS =====
  {
    category: "Transactions",
    icon: <MdAccountBalance size={26} />,
    items: [
      // {
      //   to: "/account-list",
      //   title: "Account Report",
      //   label: "Accounts",
      //   Icon: MdAccountBalance,
      //   addPath: "/account-list?action=add",
      // },
      {
        to: "/ledger-list",
        title: "Ledger List",
        label: "Ledgers",
        Icon: RiBillFill,
        addPath: "/ledger-list?action=add",
      },
      {
        to: "/mode-of-payment",
        title: "Mode Of Payment",
        label: "Payment Methods",
        Icon: RiBillFill,
        addPath: "/mode-of-payment?action=add",
      },
    ],
  },

  // ===== EXPENSES =====
  {
    category: "Expenses",
    icon: <RiBillFill size={26} />,
    items: [
      {
        to: "/expense-report",
        title: "Expense Report",
        label: "Expenses",
        Icon: RiBillFill,
        addPath: "/expense-report?action=add",
      },
      {
        to: "/expense-type",
        title: "Expense Type",
        label: "Expense Categories",
        Icon: RiBillFill,
        addPath: "/expense-type?action=add",
      },
    ],
  },

  // ===== SERVICES =====
  {
    to: "/service-list",
    title: "Service List",
    label: "Services",
    Icon: FaReceipt,
    addPath: "/service-list?action=add",
  },
  // ===== STAFF MANAGEMENT =====
  {
    category: "Staff",
    icon: <MdPeopleAlt size={26} />,
    items: [
      {
        to: "/employee-list",
        title: "Employee List",
        label: "Employees",
        Icon: MdPeopleAlt,
        addPath: "/employee-list?action=add",
      },
      {
        to: "/employee/payroll",
        title: "Payroll",
        label: "Payroll",
        Icon: MdPayments,
        addPath: "/employee/payroll?action=add",
      },
      {
        to: "/employee-position",
        title: "Employee Position",
        label: "Positions",
        Icon: GrUserWorker,
        addPath: "/employee-position?action=add",
      },
    ],
  },

  // ===== SYSTEM =====
  {
    category: "System",
    icon: <RiFileList3Line size={26} />,
    items: [
      {
        to: "/cost-center",
        title: "Cost Center",
        label: "Cost Centers",
        Icon: RiBillFill,
        addPath: "/cost-center?action=add",
      },
      {
        to: "/done-by",
        title: "Done By",
        label: "Done By",
        Icon: RiBillFill,
        addPath: "/done-by?action=add",
      },
    ],
  },

  // ===== SETTINGS =====
  {
    category: "Settings",
    icon: <IoSettingsSharp size={26} />,
    items: [
      {
        to: "/settings",
        title: "Settings",
        label: "Settings",
        Icon: IoSettingsSharp,
      },
      {
        to: "/role-list",
        title: "Role List",
        label: "Roles & Permissions",
        Icon: HiArrowsExpand,
        addPath: "/role-list?action=add",
      },
      {
        to: "/user-list",
        title: "User List",
        label: "Users",
        Icon: HiArrowsExpand,
        addPath: "/user-list?action=add",
      },
    ],
  },
];

const Sidebar = ({
  isCollapsed,
  onToggleCollapse,
  isOpenOnMobile,
  onCloseOnMobile,
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [customPages, setCustomPages] = useState([]);

  useEffect(() => {
    const fetchCustomPages = async () => {
      try {
        const { data } = await api.get("/custom-pages");
        setCustomPages(data.data || []);
      } catch (error) {
        console.error("Failed to fetch custom pages", error);
      }
    };
    fetchCustomPages();
  }, []);

  const [openCategories, setOpenCategories] = useState({
    Expenses: true,
    Reports: true,
    List: true,
    "Custom Pages": true,
  });

  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [popupPosition, setPopupPosition] = useState({
    top: 0,
    left: 0,
    maxHeight: "auto",
  });
  const categoryRefs = useRef({});
  const hidePopupTimer = useRef(null);

  const getUserRole = () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      return userData?.role || null;
    } catch (error) {
      return null;
    }
  };
  const userRole = getUserRole();

  const filteredSidebarData = useMemo(() => {
    let finalSidebarData = [...sidebarData];

    if (customPages.length > 0) {
      finalSidebarData.push({
        category: "Custom Pages",
        icon: <RiFileList3Line size={26} />,
        items: customPages.map((page) => ({
          to: page.path,
          title: page.title,
          label: page.title,
          Icon: RiFileList3Line,
        })),
      });
    }

    if (userRole !== "admin") {
      return finalSidebarData.map((category) => {
        if (category.category === "Settings") {
          return {
            ...category,
            items: category.items.filter((item) => item.to !== "/user-list"),
          };
        }
        return category;
      });
    }
    return finalSidebarData;
  }, [userRole, customPages]);

  const handleLogout = () => {
    localStorage.clear();
    queryClient.clear();
    navigate("/login");
  };

  const handleCategoryToggle = (category) => {
    if (isCollapsed && !isMobile) return;
    setOpenCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleMouseEnter = (category) => {
    if (!isCollapsed || isMobile) return;
    clearTimeout(hidePopupTimer.current);
    const node = categoryRefs.current[category];
    if (node) {
      const rect = node.getBoundingClientRect();
      const bottomMargin = 20;
      const calculatedMaxHeight = window.innerHeight - rect.top - bottomMargin;
      setPopupPosition({
        top: rect.top,
        left: rect.right + 10,
        maxHeight: calculatedMaxHeight,
      });
      setHoveredCategory(category);
    }
  };

  const handleMouseLeave = () => {
    if (!isCollapsed || isMobile) return;
    hidePopupTimer.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 200);
  };

  const handleLinkClick = () => {
    setHoveredCategory(null);
    if (isMobile) onCloseOnMobile();
  };

  const showLabels = isMobile || !isCollapsed;

  const renderNavItems = (items, isChild = false) => {
    return items.map((item, index) => {
      const isCategory = item.items && item.items.length > 0;
      if (isCategory) {
        const isOpen = !!openCategories[item.category];
        const isCategoryActive = item.items.some(
          (child) => location.pathname === child.to,
        );

        return (
          <li
            key={item.category || index}
            className="gadgetx-sidebar__nav-category"
            ref={(el) => (categoryRefs.current[item.category] = el)}
            onMouseEnter={() => handleMouseEnter(item.category)}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`gadgetx-sidebar__nav-category-header ${
                isCategoryActive ? "is-active" : ""
              }`}
              onClick={() => handleCategoryToggle(item.category)}
              title={item.category}
            >
              <span className="gadgetx-sidebar__nav-category-icon">
                {item.icon}
              </span>
              {showLabels && (
                <>
                  <span className="gadgetx-sidebar__nav-category-label">
                    {item.category}
                  </span>
                  <span className="gadgetx-sidebar__nav-category-arrow">
                    {isOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                  </span>
                </>
              )}
            </div>
            {showLabels && isOpen && (
              <div className="gadgetx-sidebar__nav-submenu">
                <ul>{renderNavItems(item.items, true)}</ul>
              </div>
            )}
          </li>
        );
      } else {
        return (
          <li key={item.to}>
            <SidebarLink
              to={item.to}
              title={item.title}
              label={item.label}
              Icon={item.Icon}
              showLabel={showLabels}
              onClick={handleLinkClick}
              isChild={isChild}
              addPath={item.addPath}
            />
          </li>
        );
      }
    });
  };

  const renderPopupItems = (items) => {
    return items.map((child, index) => (
      <li key={child.to || index}>
        <SidebarLink
          to={child.to}
          title={child.title}
          label={child.label}
          Icon={child.Icon}
          showLabel={true}
          onClick={handleLinkClick}
          isChild={true}
          addPath={child.addPath}
        />
      </li>
    ));
  };

  return (
    <>
      <aside
        className={`gadgetx-sidebar ${
          !isMobile && isCollapsed ? "collapsed" : ""
        } ${isMobile && isOpenOnMobile ? "mobile-open" : ""}`}
      >
        <nav className="gadgetx-sidebar__nav fs16 fw600">
          <ul>{renderNavItems(filteredSidebarData)}</ul>
        </nav>

        <div
          className="gadgetx-sidebar__logout fs16 fw600"
          onClick={handleLogout}
          title="Logout"
        >
          <span className="gadgetx-sidebar__logout-icon">
            <RiLogoutBoxRLine size={26} />
          </span>
          {showLabels && (
            <span className="gadgetx-sidebar__logout-label">Logout</span>
          )}
        </div>
      </aside>

      {!isMobile &&
        isCollapsed &&
        filteredSidebarData
          .filter((item) => item.items && item.items.length > 0)
          .map((item) => (
            <div
              key={item.category}
              className={`gadgetx-sidebar__collapsed-popup fs16 ${
                hoveredCategory === item.category ? "open" : ""
              }`}
              style={{
                top: `${popupPosition.top}px`,
                left: `${popupPosition.left}px`,
                maxHeight: `${popupPosition.maxHeight}px`,
              }}
              onMouseEnter={() => handleMouseEnter(item.category)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="gadgetx-sidebar__collapsed-popup-header">
                {item.category}
              </div>
              <ul className="gadgetx-sidebar__collapsed-popup-list">
                {renderPopupItems(item.items)}
              </ul>
            </div>
          ))}
    </>
  );
};

export default Sidebar;
