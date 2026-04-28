import Dashboard from "@/apps/user/pages/Dashboard";
import DynamicCustomPage from "@/apps/user/pages/DynamicCustomPage";
import ExpenseReport from "@/apps/user/pages/Reports/ExpenseReport";
import ExpenseType from "@/apps/user/pages/List/ExpenseTypeList";
import EmployeeList from "@/apps/user/pages/List/EmployeeList";
import EmployeePositionList from "@/apps/user/pages/List/EmployeePositionList";
import PayrollList from "@/apps/user/pages/List/PayrollList";
import CostCenterList from "@/apps/user/pages/List/CostCenterList";
import DoneByList from "@/apps/user/pages/List/DoneByList";
import Settings from "@/apps/user/pages/Settings";
import BrandList from "@/apps/user/pages/List/BrandList";
import CategoryList from "@/apps/user/pages/List/CategoryList";
// import PartnerList from "@/apps/user/pages/List/PartnerList"
// import AccountList from "@/apps/user/pages/List/AccountList"
import LedgerList from "@/apps/user/pages/List/LedgerList"
import SupplierList from "@/apps/user/pages/List/SupplierList"
import ModeOfPaymentList from "@/apps/user/pages/List/ModeOfPaymentList"
import CustomerList from "@/apps/user/pages/List/CustomerList"

import Purchase from "@/apps/user/pages/Transactions/Purchase";
import PurchaseReport from "@/apps/user/pages/Reports/PurchaseReport";
import Sales from "@/apps/user/pages/Transactions/sales";
import SaleReport from "@/apps/user/pages/Reports/SaleReport";
import ItemList from "@/apps/user/pages/List/ItemList";

const userRoutes = [
  { path: "/", element: <Dashboard /> },
  { path: "/expense-report", element: <ExpenseReport /> },
  { path: "/employee-list", element: <EmployeeList /> },
  { path: "/employee-position", element: <EmployeePositionList /> },
  { path: "/employee/payroll", element: <PayrollList /> },

  { path: "/expense-type", element: <ExpenseType /> },

  { path: "/cost-center", element: <CostCenterList /> },
  { path: "/done-by", element: <DoneByList /> },
  { path: "/brand-list", element: <BrandList /> },
  { path: "/category-list", element: <CategoryList /> },
  { path: "/item-list", element: <ItemList /> },

  // { path: "/user-list", element: <UserList /> },
  { path: "/settings", element: <Settings /> },
  // { path: "/partner-list", element: <PartnerList /> },
  // { path: "/account-list", element: <AccountList /> },
  { path: "/ledger-list", element: <LedgerList /> },
  { path: "/mode-of-payment", element: <ModeOfPaymentList /> },
  { path: "/suppliers-list", element: <SupplierList /> },
  { path: "/customer-list", element: <CustomerList /> },

  { path: "/purchase-report", element: <PurchaseReport /> },
  { path: "/Purchase/:mode", element: <Purchase /> },
  { path: "/Purchase/:mode/:id", element: <Purchase /> },
  { path: "/sale-report", element: <SaleReport /> },
  { path: "/sale/:mode", element: <Sales /> },
  { path: "/sale/:mode/:id", element: <Sales /> },
  { path: "/*", element: <DynamicCustomPage /> },
];

export default userRoutes;
