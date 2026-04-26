const express = require("express");
const router = express.Router();

const authRoutes = require("./api/auth/auth.routes");
const userRoutes = require("./api/user/user.routes");
const itemRoutes = require("./api/item/item.routes");

const partyRoutes = require("./api/party/party.routes");
const expenseRoutes = require("./api/expense/expense.routes");
const salesRoutes = require("./api/sales/sales.routes");
const accountRoutes = require("./api/account/account.routes");
const purchaseRoutes = require("./api/purchase/purchase.routes");
const purchaseReturnRoutes = require("./api/purchaseReturn/purchaseReturn.routes");
const saleReturnRoutes = require("./api/saleReturn/saleReturn.routes");
const jobSheetRoutes = require("./api/jobSheet/jobsheet.routes");
const jobSheetPartsRoutes = require("./api/jobSheetParts/jobsheetparts.routes");
const expenseTypeRoutes = require("./api/expenseType/expenseType.routes");
const partnerRoutes = require("./api/partner/partner.routes");
const partnershipRoutes = require("./api/partnership/partnership.routes");
const dailySummaryRoutes = require("./api/dailySummary/dailysummary.routes");
const monthlySummaryRoutes = require("./api/monthlySummary/monthlysummary.routes");
const categoryRoutes = require("./api/category/category.routes");
const brandRoutes = require("./api/brand/brand.routes");
const cost_centerRoutes = require("./api/costCenter/costCenter.routes");
const done_byRoutes = require("./api/doneBy/doneBy.routes");
const dashboardRoutes = require("./api/dashboard/dashboard.routes");
const unitRoutes = require("./api/unit/unit.routes");
const employeeRoutes = require("./api/employee/employee.routes");
const employeepositionRoutes = require("./api/employeePosition/employeePosition.routes");
const payrollRoutes = require("./api/payroll/payroll.routes");
const roleRoutes = require("./api/role/role.routes");
const settingsRoutes = require("./api/settings/settings.routes");
const invoiceRoutes = require("./api/invoiceNumber/invoiceNumber.routes");
const printSettingsRoutes = require("./api/printSettings/printSettings.routes");
const jobsheetprintSettingsRoutes = require("./api/jobSheetPrintSettings/jobSheetPrintSettings.routes");
const tenantRoutes = require("./api/tenant/tenant.routes");
const registerSessionsRoutes = require("./api/registerSession/registerSessions.routes");
const costCenterSummaryRoutes = require("./api/costCenterSummary/costCenterSummary.routes");
const doneBySummaryRoutes = require("./api/doneBySummary/doneBySummary.routes");
const partySummaryRoutes = require("./api/partySummary/partySummary.routes");
const stockDetailedReportRoutes = require("./api/stockDetailedReport/stockDetailedReport.routes");
const itemProfitReportRoutes = require("./api/itemProfitReport/itemProfitReport.routes");

const dailyProfitReportRoutes = require("./api/dailyProfitReport/dailyProfitReport.routes");
const periodicProfitReportRoutes = require("./api/periodicProfitReport/periodicProfitReport.routes");
const balanceSheetReportRoutes = require("./api/balanceSheetReport/balanceSheetReport.routes");
const taxSummaryReportRoutes = require("./api/taxSummaryReport/taxSummaryReport.routes");
const stockValueReportRoutes = require("./api/stockValueReport/stockValueReport.routes");
const transactionRoutes = require('./api/transaction/transaction.routes')
const modeOfPaymentRoutes = require('./api/modeOfPayment/modeOfPayment.routes')
const voucherRoutes = require('./api/voucher/voucher.routes')
const ledgerRoutes = require("./api/ledger/ledger.routes");

router.use('/uploads', express.static('uploads'))

router.use("/tenants", tenantRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/items", itemRoutes);
router.use("/party", partyRoutes);
router.use("/expenses", expenseRoutes);
router.use("/sales", salesRoutes);
router.use("/accounts", accountRoutes);
router.use("/expense-type", expenseTypeRoutes);
router.use("/cost-centers", cost_centerRoutes);
router.use("/done-by", done_byRoutes);
router.use("/invoice", invoiceRoutes);

router.use("/purchase-returns", purchaseReturnRoutes);
router.use("/sale-returns", saleReturnRoutes);

router.use("/jobsheets", jobSheetRoutes);
router.use("/jobsheetparts", jobSheetPartsRoutes);
router.use("/partners", partnerRoutes);
router.use("/partnerships", partnershipRoutes);
router.use("/daily-summary", dailySummaryRoutes);
router.use("/monthly-summary", monthlySummaryRoutes);
router.use("/category", categoryRoutes);
router.use("/brand", brandRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/units", unitRoutes);
router.use("/employees", employeeRoutes);
router.use("/employee-position", employeepositionRoutes);
router.use("/employee-payroll", payrollRoutes);
router.use("/roles", roleRoutes);
router.use("/settings", settingsRoutes);
router.use("/print-settings", printSettingsRoutes);
router.use("/jobsheetprint-settings", jobsheetprintSettingsRoutes);

router.use("/cost-center-summary", costCenterSummaryRoutes);
router.use("/done-by-summary", doneBySummaryRoutes);
router.use("/party-summary", partySummaryRoutes);
router.use("/stock-detailed-report", stockDetailedReportRoutes);
router.use("/item-profit-report", itemProfitReportRoutes);

router.use("/daily-profit-report", dailyProfitReportRoutes);
router.use("/periodic-profit-report", periodicProfitReportRoutes);
router.use("/balance-sheet-report", balanceSheetReportRoutes);
router.use("/tax-summary-report", taxSummaryReportRoutes);
router.use("/stock-value-report", stockValueReportRoutes);
router.use("/transactions", transactionRoutes);
router.use("/register-sessions", registerSessionsRoutes);
router.use("/mode-of-payment", modeOfPaymentRoutes);
router.use("/vouchers", voucherRoutes);

router.use("/ledgers", ledgerRoutes);

module.exports = router;

