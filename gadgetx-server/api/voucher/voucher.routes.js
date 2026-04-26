const express = require("express");
const router = express.Router();
const validateToken = require("../../middlewares/validateToken");

// Import Voucher-specific modules
const VoucherRepository = require("./voucher.repository");
const VoucherService = require("./voucher.service");
const VoucherController = require("./voucher.controller");
const VoucherValidator = require("./voucher.validator");
const VoucherTransactionsService = require('../voucherTransaction/voucherTransaction.service');

// MODIFICATION: Import the SERVICES and their DEPENDENCIES
const ItemRepository = require('../item/item.repository');

const SalesRepository = require('../sales/sales.repository');
const SalesService = require('../sales/sales.service');

const PurchaseRepository = require('../purchase/purchase.repository');
const PurchaseService = require('../purchase/purchase.service');

const SaleReturnRepository = require('../saleReturn/saleReturn.repository');
const SaleReturnService = require('../saleReturn/saleReturn.service');

const PurchaseReturnRepository = require('../purchaseReturn/purchaseReturn.repository');
const PurchaseReturnService = require('../purchaseReturn/purchaseReturn.service');

// NEW: Import Ledger modules
const LedgerRepository = require('../ledger/ledger.repository');
const LedgerService = require('../ledger/ledger.service');


// --- Instantiate all dependencies ---

// Common dependencies
const itemRepository = new ItemRepository();

// Voucher dependencies
const voucherRepository = new VoucherRepository();
const voucherTransactionsService = new VoucherTransactionsService();

// Sales dependencies
const salesRepository = new SalesRepository();
const salesService = new SalesService(salesRepository, itemRepository);

// Purchase dependencies
const purchaseRepository = new PurchaseRepository();
const purchaseService = new PurchaseService(purchaseRepository, itemRepository);

// Sale Return dependencies
const saleReturnRepository = new SaleReturnRepository();
const saleReturnService = new SaleReturnService(saleReturnRepository, salesRepository, itemRepository);

// Purchase Return dependencies
const purchaseReturnRepository = new PurchaseReturnRepository();
const purchaseReturnService = new PurchaseReturnService(purchaseReturnRepository, purchaseRepository, itemRepository);

// NEW: Ledger dependencies
const ledgerRepository = new LedgerRepository();
const ledgerService = new LedgerService(ledgerRepository);


// MODIFICATION: Inject all required SERVICES into VoucherService
const voucherService = new VoucherService(
    voucherRepository,
    voucherTransactionsService,
    salesService,
    purchaseService,
    saleReturnService,
    purchaseReturnService,
    ledgerService
);

const voucherController = new VoucherController(voucherService);
const voucherValidator = new VoucherValidator();

// Apply middleware for all voucher routes
router.use(validateToken);

router.get(
  "/paginated",
  voucherController.getAllPaginated.bind(voucherController)
);

router
  .route("/")
  .post(
    voucherValidator.createOrUpdateValidator,
    voucherController.create.bind(voucherController)
  )
  .get(voucherController.getAll.bind(voucherController));

router
  .route("/:id")
  .get(voucherController.getById.bind(voucherController))
  .put(
    voucherValidator.createOrUpdateValidator,
    voucherController.update.bind(voucherController)
  )
  .delete(voucherController.delete.bind(voucherController));

module.exports = router;