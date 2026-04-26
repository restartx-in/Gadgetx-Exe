  import Dashboard from "@/apps/user/pages/Dashboard";
  import SaleReport from "@/apps/user/pages/Reports/SaleReport";
  import SaleReturnReport from "@/apps/user/pages/Reports/SaleReturnReport";
  import PurchaseReturnReport from "@/apps/user/pages/Reports/PurchaseReturnReport";
  import ExpenseReport from "@/apps/user/pages/Reports/ExpenseReport";
  import CashBookReport from "@/apps/user/pages/Reports/CashBookReport";
  import DailySummaryReport from "@/apps/user/pages/Reports/DailySummaryReport";
  import MonthlySummaryReport from "@/apps/user/pages/Reports/MonthlySummaryReport";
  import JobSheetReport from "@/apps/user/pages/Reports/JobSheetReport";
  import ExpenseType from "@/apps/user/pages/List/ExpenseTypeList";
  import CostCenterList from "@/apps/user/pages/List/CostCenterList";
  import DoneByList from "@/apps/user/pages/List/DoneByList";
  import CustomerList from "@/apps/user/pages/List/CustomerList";
  import SupplierList from "@/apps/user/pages/List/SupplierList";
  import AccountList from "@/apps/user/pages/List/AccountList";
  import ItemList from "@/apps/user/pages/List/ItemList";
  import JobSheet from "@/apps/user/pages/Transactions/JobSheet";
  import PartnerList from "@/apps/user/pages/List/PartnerList";
  import PartnershipReport from "@/apps/user/pages/Reports/PartnershipReport";
  import PurchaseReport from "@/apps/user/pages/Reports/PurchaseReport";
  import PurchaseReturn from "@/apps/user/pages/Transactions/PurchaseReturn";
  import Partnership from "@/apps/user/pages/Transactions/Partnership";
  import Brand from "@/apps/user/pages/List/BrandList";
  import Category from "@/apps/user/pages/List/CategoryList";
  import UnitList from "@/apps/user/pages/List/UnitTypeList";
  import POS from "@/apps/user/pages/POS";
  import EmployeeList from "@/apps/user/pages/List/EmployeeList";
  import EmployeePositionList from "@/apps/user/pages/List/EmployeePositionList";
  import PayrollList from "@/apps/user/pages/List/PayrollList";
  import Sales from "@/apps/user/pages/Transactions/sales";
  import SaleReturn from "@/apps/user/pages/Transactions/SaleReturn";
  import Purchase from "@/apps/user/pages/Transactions/Purchase";
  import UserList from "@/apps/user/pages/List/UserList/component";
  import RoleList from "@/apps/user/pages/List/RoleList";
  import Settings from "@/apps/user/pages/Settings";
  import DoneByListView from "@/apps/user/pages/Reports/DoneByListView";
  import CostCenterListSummary from "@/apps/user/pages/Reports/CostCenterListSummary";
  import PartyBasedSummary from "@/apps/user/pages/Reports/PartyBasedSummary";
  import PartyPayments from "@/apps/user/pages/Reports/PartyPayments";
  import ItemProfitReport from "@/apps/user/pages/Reports/ItemProfitReport";
  import StockDetailedReport from "@/apps/user/pages/Reports/StockDetailedReport";
  import ReceiptAgainstSale from "@/apps/user/pages/Reports/ReceiptAgainstSale";
  import ModeOfPaymentList from "@/apps/user/pages/List/ModeOfPaymentList/component";
  import DailyProfitReport from "@/apps/user/pages/Reports/DailyProfitReport";
  import PeriodicProfitReport from "@/apps/user/pages/Reports/PeriodicProfitReport";
  import BalanceSheetReport from "@/apps/user/pages/Reports/BalanceSheetReport";
  import TaxSummaryReport from "@/apps/user/pages/Reports/TaxSummaryReport";
  import StockValueReport from "@/apps/user/pages/Reports/StockValueReport";
  import RegisterSessionReport from "@/apps/user/pages/Reports/RegisterSessionReport";
  import RegisterSession from "@/apps/user/pages/Transactions/RegisterSession";
  import LedgerList from "@/apps/user/pages/List/LedgerList/component";
  import PaymentAgainstSaleReturn from "@/apps/user/pages/Reports/PaymentAgainstSaleReturn";
  import PaymentAgainstPurchase from "@/apps/user/pages/Reports/PaymentAgainstPurchase";
  import ReceiptAgainstPurchaseReturn from "@/apps/user/pages/Reports/ReceiptAgainstPurchaseReturn";
  import ReceiptReport from "@/apps/user/pages/Reports/ReceiptReport";
  import PaymentReport from "@/apps/user/pages/Reports/PaymentReport/component";
  import LedgerReport from "@/apps/user/pages/Reports/LedgerReport";
  import MonthlyLedgerReport from "@/apps/user/pages/Reports/MonthlyLedgerReport";
  const userRoutes = [
    { path: "/", element: <Dashboard /> },
    { path: "/settings", element: <Settings /> },

    { path: "/sale-report", element: <SaleReport /> },
    { path: "/sale/:mode", element: <Sales /> },
    { path: "/sale/:mode/:id", element: <Sales /> },

    { path: "/expense-report", element: <ExpenseReport /> },
    { path: "/cash-book-report", element: <CashBookReport /> },
    { path: "/partnership-report", element: <PartnershipReport /> },

    { path: "/register-session-report", element: <RegisterSessionReport /> },
    { path: "/register-session/:mode", element: <RegisterSession /> },
    { path: "/register-session/:mode/:id", element: <RegisterSession /> },
    { path: "/register-session", element: <RegisterSession /> },

    { path: "/purchase-report", element: <PurchaseReport /> },
    { path: "/purchase/:mode", element: <Purchase /> },
    { path: "/purchase/:mode/:id", element: <Purchase /> },

    { path: "/purchase-return-report", element: <PurchaseReturnReport /> },
    { path: "/purchase-return/:mode", element: <PurchaseReturn /> },
    { path: "/purchase-return/:mode/:id", element: <PurchaseReturn /> },

    { path: "/expense-type", element: <ExpenseType /> },
    { path: "/cost-center", element: <CostCenterList /> },
    { path: "/done-by", element: <DoneByList /> },

    { path: "/customer-list", element: <CustomerList /> },
    { path: "/jobsheet-Report", element: <JobSheetReport /> },
    { path: "/jobsheet-add", element: <JobSheet /> },

    { path: "/account-list", element: <AccountList /> },
    { path: "/account-list/add", element: <AccountList /> },
    { path: "/item-list", element: <ItemList /> },
    { path: "/suppliers-list", element: <SupplierList /> },
    { path: "/employee-list", element: <EmployeeList /> },
    { path: "/employee-position", element: <EmployeePositionList /> },
    { path: "/employee/payroll", element: <PayrollList /> },

    { path: "/mode-of-payment", element: <ModeOfPaymentList /> },
    { path: "/mode-of-payment/add", element: <ModeOfPaymentList /> },

    { path: "/sale-return-report", element: <SaleReturnReport /> },
    { path: "/sale-return", element: <SaleReturn /> },
    { path: "/sale-return/:mode/:id", element: <SaleReturn /> },
    { path: "/sale-return/:mode", element: <SaleReturn /> },

    { path: "/Partner-list", element: <PartnerList /> },
    { path: "/Partner-list/add", element: <PartnerList /> },
    { path: "/partnership-report/add", element: <Partnership /> },
    { path: "/partnership-report/edit/:id", element: <Partnership /> },

    { path: "/daily-summary-report", element: <DailySummaryReport /> },
    { path: "/monthly-summary-report", element: <MonthlySummaryReport /> },

    { path: "/done-by-summary", element: <DoneByListView /> },
    { path: "/cost-center-summary", element: <CostCenterListSummary /> },

    { path: "/party-based-summary", element: <PartyBasedSummary /> },
    { path: "/party-payment", element: <PartyPayments /> },
    { path: "/stock-detailed-report", element: <StockDetailedReport /> },
    { path: "/item-profit-report", element: <ItemProfitReport /> },

    { path: "/daily-profit-report", element: <DailyProfitReport /> },
    { path: "/periodic-profit-report", element: <PeriodicProfitReport /> },
    { path: "/balance-sheet-report", element: <BalanceSheetReport /> },
    { path: "/tax-summary-report", element: <TaxSummaryReport /> },
    { path: "/stock-value-report", element: <StockValueReport /> },
    { path: "/ledger-report", element: <LedgerReport /> },
    { path: "/monthly-ledger-report", element: <MonthlyLedgerReport /> },

    { path: "/brand-list", element: <Brand /> },
    { path: "/category-list", element: <Category /> },
    { path: "/unit-list", element: <UnitList /> },
    { path: "/pos", element: <POS /> },
    { path: "/user-list", element: <UserList /> },
    { path: "/role-list", element: <RoleList /> },
    { path: "/ledger-list", element: <LedgerList /> },

    { path: "/receipt-against-sale", element: <ReceiptAgainstSale /> },

    { path: "/receipt-report", element: <ReceiptReport /> },
    { path: "/payment-report", element: <PaymentReport /> },
    
    { path: "/payment-against-purchase", element: <PaymentAgainstPurchase /> },
    { path: "/payment-against-purchase/:mode", element: <PaymentAgainstPurchase /> },
    { path: "/payment-against-purchase/:mode/:id", element: <PaymentAgainstPurchase /> },

    { path: "/payment-against-sale-return", element: <PaymentAgainstSaleReturn /> },
    { path: "/payment-against-sale-return/:mode", element: <PaymentAgainstSaleReturn /> },
    { path: "/payment-against-sale-return/:mode/:id", element: <PaymentAgainstSaleReturn /> },

    { path: "/receipt-against-sale", element: <ReceiptAgainstSale /> },
    { path: "/receipt-against-sale/:mode", element: <ReceiptAgainstSale /> },
    { path: "/receipt-against-sale/:mode/:id", element: <ReceiptAgainstSale /> },

    { path: "/receipt-against-purchase-return", element: <ReceiptAgainstPurchaseReturn /> },
    { path: "/receipt-against-purchase-return/:mode", element: <ReceiptAgainstPurchaseReturn /> },
    { path: "/receipt-against-purchase-return/:mode/:id", element: <ReceiptAgainstPurchaseReturn /> },
    { }
  ];

  export default userRoutes;
