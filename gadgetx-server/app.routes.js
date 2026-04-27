require("dotenv").config();

const cors = require("cors");
const express = require("express");

const authRoutes = require("./api/auth/auth.routes");
const userRoutes = require("./api/user/user.routes");

const employeeRoutes = require("./api/employee/employee.routes");
const employeepositionRoutes = require("./api/employeeposition/employeeposition.routes");
// const employeeAttendanceRoutes = require("./api/employeeAttendance/employeeAttendance.routes");
const PayrollRoutes = require("./api/Payroll/Payroll.routes");
const expenseRoutes = require("./api/expense/expense.routes");
const expenseTypeRoutes = require("./api/expenseType/expenseType.routes");
const cost_centerRoutes = require('./api/costCenter/costCenter.routes')
const done_byRoutes = require('./api/doneBy/doneBy.routes')
const settingsRoutes = require('./api/settings/settings.routes')
const roleRoutes = require('./api/role/role.routes')
const tenantRoutes = require('./api/tenant/tenant.routes')
const brandRoutes = require("./api/brand/brand.routes");
const categoryRoutes = require("./api/category/category.routes");
const customerRoutes = require("./api/customer/customer.routes");
const accountRoutes = require("./api/account/account.routes");
const partnerRoutes = require("./api/partner/partner.routes");
const partyRoutes = require("./api/party/party.routes");
const ledgerRoutes = require("./api/ledger/ledger.routes");
const voucherRoutes = require("./api/voucher/voucher.routes");
const modeofpaymentRoutes = require("./api/modeOfPayment/modeOfPayment.routes");
const invoiceNumberRoutes = require("./api/invoiceNumber/invoiceNumber.routes");
const reportFieldPermissionsRoutes = require("./api/reportFieldPermissions/reportFieldPermissions.routes");
const transactionFieldPermissionsRoutes = require("./api/transactionFieldPermissions/transactionFieldPermissions.routes");
const purchaseRoutes = require("./api/purchase/purchase.routes");


const salesRoutes = require("./api/sales/sales.routes");
const dashboardRoutes = require("./api/dashboard/dashboard.routes");
const printSettingsRoutes = require("./api/printSettings/printSettings.routes");
const customPagesRoutes = require("./api/customPages/customPages.routes");
const customPageDataRoutes = require("./api/customPageData/customPageData.routes");
const itemRoutes = require("./api/item/item.routes");

const router = express.Router();

router.use("/api/auth", authRoutes);
router.use("/api/users", userRoutes);
router.use("/api/employees", employeeRoutes);
router.use("/api/employee-position", employeepositionRoutes);
// router.use("/api/employee-attendance", employeeAttendanceRoutes);
router.use("/api/employee-payroll", PayrollRoutes);
router.use("/api/expenses", expenseRoutes);
router.use('/api/expense-type', expenseTypeRoutes);
router.use('/api/cost-centers', cost_centerRoutes)
router.use('/api/done-by', done_byRoutes)
router.use('/api/settings', settingsRoutes)
router.use('/api/roles', roleRoutes)
router.use('/api/tenants', tenantRoutes)
router.use("/api/brand", brandRoutes);
router.use("/api/category", categoryRoutes);
router.use("/api/customer", customerRoutes);
router.use("/api/accounts", accountRoutes);
router.use("/api/partners", partnerRoutes);
router.use("/api/party", partyRoutes);
router.use("/api/ledgers", ledgerRoutes);
router.use("/api/vouchers", voucherRoutes);
router.use("/api/mode-of-payment", modeofpaymentRoutes);
router.use("/api/invoice-number", invoiceNumberRoutes);
router.use("/api/report-field-permissions", reportFieldPermissionsRoutes);
router.use("/api/transaction-field-permissions", transactionFieldPermissionsRoutes);
router.use("/api/purchases",purchaseRoutes);



router.use("/api/sales", salesRoutes);
router.use("/api/dashboard", dashboardRoutes);
router.use("/api/print-settings", printSettingsRoutes);
router.use("/api/custom-pages", customPagesRoutes);
router.use("/api/custom-page-data", customPageDataRoutes);

router.use("/api/items", itemRoutes);
module.exports = router;

