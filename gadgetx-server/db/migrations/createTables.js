const { pool } = require("../../config/db");

// Import all table creation modules
const createRoleTable = require("../../api/role/role.table.js");
const createUsersTable = require("../../api/user/user.table.js");
const createUserTokenTable = require("../../api/token/token.table.js");
const createPartyTable = require("../../api/party/party.table.js");
const createPartnerTable = require("../../api/partner/partner.table.js");
const createAccountTable = require("../../api/account/account.table.js");
const createAccountTrigger = require("../../api/account/account.query.js");
const createCategoryTable = require("../../api/category/category.table.js");
const createBrandTable = require("../../api/brand/brand.table.js");
const createUnitTable = require("../../api/unit/unit.table.js");
const createItemTable = require("../../api/item/item.table.js");
const createSalesTable = require("../../api/sales/sales.table.js");
const createSalesItemsTable = require("../../api/saleItem/saleItem.table.js");
const createSaleReturnTable = require("../../api/saleReturn/saleReturn.table.js");
const createPurchaseTable = require("../../api/purchase/purchase.table.js");
const createPurchaseItemsTable = require("../../api/purchaseItem/purchaseItem.table.js");
const createPurchaseReturnTable = require("../../api/purchaseReturn/purchaseReturn.table.js");
const createJobSheetsTable = require("../../api/jobSheet/jobSheet.table.js");
const createJobsheetTriggers = require("../../api/jobSheet/jobSheet.query.js");
const createJobSheetPartsTable = require("../../api/jobSheetParts/jobSheetParts.table.js");
const createExpenseTable = require("../../api/expense/expense.table.js");
const createExpenseTypeTable = require("../../api/expenseType/expenseType.table.js");
const createPartnershipTable = require("../../api/partnership/partnership.table.js");
const createCostCenterTable = require("../../api/costCenter/costcenter.table.js");
const createDoneByTable = require("../../api/doneBy/doneBy.table.js");
const createEmployeeTable = require("../../api/employee/employee.table.js");
const createEmployeePositionTable = require("../../api/employeePosition/employeePosition.table.js");
const createPayrollTable = require("../../api/payroll/payroll.table.js");
const createSettingsTable = require("../../api/settings/settings.table.js");
const createInvoiceNumberTable = require("../../api/invoiceNumber/invoiceNumber.table.js");
const createQueryTable = require("./tables/query.js");
const createPrintSettingsTable = require("../../api/printSettings/printSettings.table.js");
const jobsheetprintsettingsTable = require("../../api/jobSheetPrintSettings/jobSheetPrintSettings.table.js");
const createTenantTable = require("../../api/tenant/tenant.table.js");
const createTransactionTable = require("../../api/transaction/transaction.table.js");
const createTransactionLedgerTable = require("../../api/transactionLedger/transactionLedger.table.js");
const createTransactionPaymentsTable = require("../../api/transactionPayments/transactionPayments.table.js");
const createRegisterSessionsTable = require("../../api/registerSession/registerSessions.Table.js");
const createModeOfPaymentTable = require("../../api/modeOfPayment/modeOfPayment.table.js");
const createExpenseMigrations=require("../../api/expense/expense.queries.js")
const createLedgerTable=require("../../api/ledger/ledger.table.js");
const createVoucherTable=require("../../api/voucher/voucher.table.js");
const createVoucherTransactionTable=require("../../api/voucherTransaction/voucherTransaction.table.js");
const createSalesTrigger = require("../../api/sales/sales.query.js");
const createPurchaseReturnTrigger = require("../../api/purchaseReturn/purchaseReturn.query.js");
const createSaleReturnTrigger = require("../../api/saleReturn/saleReturn.query.js");

const createTables = async () => {
  const client = await pool.connect();
  try {

    // await createQueryTable(client);

    
    await createTenantTable(client); // No dependencies
    await createRoleTable(client);
    await createUsersTable(client); // No dependencies
    await createUserTokenTable(client); // Depends on user
    await createInvoiceNumberTable(client);
    await createCostCenterTable(client); // Depends on user
    await createDoneByTable(client); // Depends on user

    await createPartnerTable(client); // Depends on user
    await createCategoryTable(client); // Depends on user
    await createBrandTable(client); // Depends on user
    await createUnitTable(client); // Depends on user
    await createExpenseTypeTable(client); // Depends on user
    await createEmployeePositionTable(client);
    await createEmployeeTable(client);
    await createSettingsTable(client)
    await createPrintSettingsTable(client);
    await createModeOfPaymentTable(client);

    // // --- LEVEL 2: Tables depending on Level 1 ---
    await createLedgerTable(client);

    await createPartyTable(client); // Depends on user

    await createAccountTable(client); // Depends on user, partner
    await createPayrollTable(client);
    await createItemTable(client); // Depends on user, category, brand, supplier
    await createJobSheetsTable(client); // Depends on customer
    //
    // --- LEVEL 3: Transactional tables depending on Level 1 & 2 ---
    await createPurchaseTable(client); // Depends on user, supplier, account
    await createSalesTable(client); // Depends on user, customer, account

    await createExpenseTable(client); // Depends on user, account
    await createExpenseMigrations(client);

    await createPartnershipTable(client); // Depends on user, partner, account
    //
    // --- LEVEL 4: Transactional detail tables (many-to-many, etc.) ---
    await createPurchaseItemsTable(client); // Depends on purchase, item
    await createSalesItemsTable(client); // Depends on sales, item
    await createJobSheetPartsTable(client); // Depends on job_sheets, item
    //
    // --- LEVEL 5: Return tables and ledgers --
    await createPurchaseReturnTable(client); // Depends on purchase, item, account
    await createSaleReturnTable(client); // Depends on sales, item, account
    await createRegisterSessionsTable(client); // Depends on done_by, cost_center
    await createTransactionTable(client); // Depends on tenant, cost_center, done_by
    await createTransactionPaymentsTable(client); // Depends on transaction, account, sales, purchase, sale_return, purchase_return
    await createTransactionLedgerTable(client); // Depends on transaction, account
    await jobsheetprintsettingsTable(client); // Depends on transaction, account

    await createVoucherTable(client); 
    await createVoucherTransactionTable(client); 
    
    await createSalesTrigger(client);
    await createPurchaseReturnTrigger(client);
    await createSaleReturnTrigger(client);
    await createAccountTrigger(client);  



    console.log("✅ All tables created successfully in the correct order.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
  }
};

module.exports = createTables;
