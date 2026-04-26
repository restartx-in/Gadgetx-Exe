import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

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

const sidebarData = [
  { to: "/", title: "Dashboard", label: "Dashboard", Icon: MdDashboard },
  {
    to: "/jobsheet-Report",
    title: "Job Sheet",
    label: "Job Sheet",
    Icon: LuFileSpreadsheet,
  },
  {
    category: "Sales",
    icon: <FaShoppingCart size={26} />,
    items: [
      {
        to: "/sale-report",
        title: "Sales Report",
        label: "Sales",
        Icon: FaShoppingCart,
      },
      {
        to: "/sale-return-report",
        title: "Sales Return",
        label: "Sales Return",
        Icon: TbTruckReturn,
      },
    ],
  },

  {
    category: "Purchase",
    icon: <HiShoppingBag size={26} />,
    items: [
      {
        to: "/purchase-report",
        title: "Purchase Report",
        label: "Purchase",
        Icon: MdShoppingBag,
      },
      {
        to: "/purchase-return-report",
        title: "Purchase Return",
        label: "Purchase Return",
        Icon: TbTruckReturn,
      },
    ],
  },

  {
    category: "Employees",
    icon: <MdPeopleAlt size={26} />,
    items: [
      {
        to: "/employee-list",
        title: "Employee list",
        label: "Employees",
        Icon: MdPeopleAlt,
      },
      {
        to: "/employee/payroll",
        title: "Payroll",
        label: "Payroll",
        Icon: MdPayments,
      },
      {
        to: "/employee-position",
        title: "Employee Position",
        label: "Employee Position",
        Icon: GrUserWorker,
      },
    ],
  },

  {
    category: "Expenses",
    icon: <RiBillFill size={26} />,
    items: [
      {
        to: "/expense-report",
        title: "Expense Report",
        label: "Expenses",
        Icon: RiBillFill,
      },
      {
        to: "/expense-type",
        title: "Expense Type",
        label: "Expense Types",
        Icon: RiBillFill,
      },
    ],
  },

  {
    category: "Stock Items",
    icon: <FaStoreAlt size={26} />,
    items: [
      {
        to: "/brand-list",
        title: "Brand List",
        label: "Brand",
        Icon: MdBrandingWatermark,
      },
      {
        to: "/category-list",
        title: "Category List",
        label: "Category",
        Icon: MdCategory,
      },
      {
        to: "/unit-list",
        title: "Unit List",
        label: "Unit",
        Icon: RiRuler2Line,
      },
      { to: "/item-list", title: "Item Report", label: "Items", Icon: CiShop },
    ],
  },

  {
    category: "Reports",
    icon: <LuFileSpreadsheet size={26} />,
    items: [
      {
        to: "/cash-book-report",
        title: "Cash Book",
        label: "Cash Book",
        Icon: FaCashRegister,
      },
      {
        to: "/partnership-report",
        title: "Partnership Report",
        label: "Partnerships",
        Icon: RiUserAddFill,
      },
      {
        to: "/register-session-report",
        title: "Register Session Report",
        label: "Register Sessions",
        Icon: LuFileSpreadsheet,
      },
      {
        to:"/ledger-report",
        title: "Ledger Report",
        label: "Ledger",
        Icon: LuFileSpreadsheet,
      }
    ],
  },

  {
    category: "Receipt",
    icon: <RiReceiptFill size={26} />,
    items: [
      {
        to: "/receipt-report",
        title: "Receipt Report",
        label: "Receipt Report",
        Icon: TbFileReport,
      },
      {
        to: "/receipt-against-sale",
        title: "Receipt Against Sale",
        label: "Receipt Against Sale",
        Icon: LuReceipt,
      },
      {
        to: "/receipt-against-purchase-return",
        title: "Receipt Against Purchase Return",
        label: "Receipt Against Purchase Return",
        Icon: LuReceiptCent,
      },
    ],
  },
  {
    category: "Payment",
    icon: <FaReceipt size={26} />,
    items: [
      {
        to: "/payment-report",
        title: "Payment Report",
        label: "Payment Report",
        Icon: TbFileReport,
      },

      {
        to: "/payment-against-purchase",
        title: "Payment Against Purchase",
        label: "Payment Against Purchase",
        Icon: BsReceipt,
      },

      {
        to: "/payment-against-sale-return",
        title: "Payment Against Sale Return",
        label: "Payment Against Sale Return",
        Icon: MdReceipt,
      },
    ],
  },
  {
    category: "Summary",
    icon: <LuFileSpreadsheet size={26} />,
    items: [
      {
        to: "/daily-summary-report",
        title: "Daily Summary",
        label: "Daily Summary",
        Icon: IoPerson,
      },
      {
        to: "/monthly-summary-report",
        title: "Monthly Summary",
        label: "Monthly Summary",
        Icon: IoPerson,
      },

      {
        to: "/done-by-summary",
        title: "Done By Summary",
        label: "Done By Summary",
        Icon: RiBillFill,
      },
      {
        to: "/monthly-ledger-report",
        title: "Monthly Ledger",
        label: "Monthly Ledger",
        Icon: RiBillFill,
      },
      {
        to: "/cost-center-summary",
        title: "Cost Center Summary",
        label: "Cost Center Summary",
        Icon: RiBillFill,
      },
      {
        to: "/party-based-summary",
        title: "Party Summary",
        label: "Party Summary",
        Icon: RiBillFill,
      },
      {
        to: "/party-payment",
        title: "Party Payment",
        label: "Party Payment",
        Icon: RiBillFill,
      },
      {
        to: "/stock-detailed-report",
        title: "Stock Detailed Report",
        label: "Stock Report",
        Icon: MdOutlineInventory,
      },
      {
        to: "/item-profit-report",
        title: "Item Profit Report",
        label: "Item Profit",
        Icon: MdOutlineInventory,
      },
      {
        to: "/daily-profit-report",
        title: "Daily Profit Report",
        label: "Daily Profit",
        Icon: FaSun,
      },
      {
        to: "/periodic-profit-report",
        title: "Periodic Profit Report",
        label: "Periodic Profit",
        Icon: FaChartLine,
      },
      {
        to: "/stock-value-report",
        title: "Stock Value Report",
        label: "Stock Value",
        Icon: MdInventory,
      },
      {
        to: "/tax-summary-report",
        title: "Tax Summary Report",
        label: "Tax Summary",
        Icon: FaFileInvoiceDollar,
      },
      {
        to: "/balance-sheet-report",
        title: "Balance Sheet Report",
        label: "Balance Sheet",
        Icon: FaBalanceScale,
      },
    ],
  },

  {
    category: "List",
    icon: <RiFileList3Line size={26} />,
    items: [
      {
        to: "/cost-center",
        title: "Cost Center",
        label: "Cost Center",
        Icon: RiBillFill,
      },
      { to: "/done-by", title: "Done By", label: "Done By", Icon: RiBillFill },
      {
        to: "/suppliers-list",
        title: "Supplier Report",
        label: "Suppliers",
        Icon: IoManSharp,
      },
      {
        to: "/customer-list",
        title: "Customer Report",
        label: "Customers",
        Icon: IoPerson,
      },
      {
        to: "/account-list",
        title: "Account Report",
        label: "Account",
        Icon: MdAccountBalance,
      },
      {
        to: "/partner-list",
        title: "Partner List",
        label: "Partners",
        Icon: BiSolidUser,
      },
      {
        to: "/mode-of-payment",
        title: "Mode Of Payment",
        label: "Mode Of Payment",
        Icon: RiBillFill,
      },
      {
        to: "/ledger-list",
        title: "Ledger List",
        label: "Ledgers",
        Icon: RiBillFill,
      },
    ],
  },

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
        label: "Role List",
        Icon: HiArrowsExpand,
      },
      {
        to: "/user-list",
        title: "User List",
        label: "User List",
        Icon: HiArrowsExpand,
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

  const [openCategories, setOpenCategories] = useState({
    Expenses: true,
    Reports: true,
    List: true,
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
    if (userRole !== "admin") {
      return sidebarData.map((category) => {
        if (category.category === "Settings") {
          return {
            ...category,
            items: category.items.filter((item) => item.to !== "/user-list"),
          };
        }
        return category;
      });
    }
    return sidebarData;
  }, [userRole]);

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

  const renderNavItems = (items) => {
    return items.map((item, index) => {
      const isCategory = item.items && item.items.length > 0;
      if (isCategory) {
        const isOpen = !!openCategories[item.category];
        return (
          <li
            key={item.category || index}
            className="sidebar__nav-category"
            ref={(el) => (categoryRefs.current[item.category] = el)}
            onMouseEnter={() => handleMouseEnter(item.category)}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="sidebar__nav-category-header"
              onClick={() => handleCategoryToggle(item.category)}
              title={item.category}
            >
              <span className="sidebar__nav-category-icon">{item.icon}</span>
              {showLabels && (
                <>
                  <span className="sidebar__nav-category-label">
                    {item.category}
                  </span>
                  <span className="sidebar__nav-category-arrow">
                    {isOpen ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                  </span>
                </>
              )}
            </div>
            {showLabels && isOpen && (
              <div className="sidebar__nav-submenu">
                <ul>{renderNavItems(item.items)}</ul>
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
        />
      </li>
    ));
  };

  return (
    <>
      <aside
        className={`sidebar ${!isMobile && isCollapsed ? "collapsed" : ""} ${
          isMobile && isOpenOnMobile ? "mobile-open" : ""
        }`}
      >
        <nav className="sidebar__nav fs16 fw600">
          <ul>{renderNavItems(filteredSidebarData)}</ul>
        </nav>

        <div
          className="sidebar__logout fs16 fw600"
          onClick={handleLogout}
          title="Logout"
        >
          <span className="sidebar__logout-icon">
            <RiLogoutBoxRLine size={26} />
          </span>
          {showLabels && <span className="sidebar__logout-label">Logout</span>}
        </div>
      </aside>

      {!isMobile &&
        isCollapsed &&
        filteredSidebarData
          .filter((item) => item.items && item.items.length > 0)
          .map((item) => (
            <div
              key={item.category}
              className={`sidebar__collapsed-popup fs16 ${
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
              <div className="sidebar__collapsed-popup-header">
                {item.category}
              </div>
              <ul className="sidebar__collapsed-popup-list">
                {renderPopupItems(item.items)}
              </ul>
            </div>
          ))}
    </>
  );
};

export default Sidebar;
