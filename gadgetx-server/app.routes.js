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

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/employees", employeeRoutes);
router.use("/employee-position", employeepositionRoutes);
// router.use("/employee-attendance", employeeAttendanceRoutes);
router.use("/employee-payroll", PayrollRoutes);
router.use("/expenses", expenseRoutes);
router.use('/expense-type', expenseTypeRoutes);
router.use('/cost-centers', cost_centerRoutes)
router.use('/done-by', done_byRoutes)
router.use('/settings', settingsRoutes)
router.use('/roles', roleRoutes)
router.use('/tenants', tenantRoutes)
router.use("/brand", brandRoutes);
router.use("/category", categoryRoutes);
router.use("/customer", customerRoutes);
router.use("/accounts", accountRoutes);
router.use("/partners", partnerRoutes);
router.use("/party", partyRoutes);
router.use("/ledgers", ledgerRoutes);
router.use("/vouchers", voucherRoutes);
router.use("/mode-of-payment", modeofpaymentRoutes);
router.use("/invoice-number", invoiceNumberRoutes);
router.use("/report-field-permissions", reportFieldPermissionsRoutes);
router.use("/transaction-field-permissions", transactionFieldPermissionsRoutes);
router.use("/purchases",purchaseRoutes);

router.use("/sales", salesRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/print-settings", printSettingsRoutes);
router.use("/custom-pages", customPagesRoutes);
router.use("/custom-page-data", customPageDataRoutes);

router.use("/items", itemRoutes);
module.exports = router;

