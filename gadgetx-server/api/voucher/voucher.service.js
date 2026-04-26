class VoucherService {
  // MODIFICATION: Inject services, including LedgerService
  constructor(
    voucherRepository,
    voucherTransactionsService,
    salesService,
    purchaseService,
    saleReturnService,
    purchaseReturnService,
    ledgerService // NEW: LedgerService injection
  ) {
    this.repository = voucherRepository;
    this.voucherTransactionsService = voucherTransactionsService;
    // Store injected services
    this.salesService = salesService;
    this.purchaseService = purchaseService;
    this.saleReturnService = saleReturnService;
    this.purchaseReturnService = purchaseReturnService;
    this.ledgerService = ledgerService; // NEW: Store LedgerService
  }

  // NEW PRIVATE METHOD for ledger balance updates
  async _updateLedgerBalances(client, fromLedgerId, toLedgerId, tenantId, amount, operation = 'add') {
    const totalAmount = parseFloat(amount);
    if (isNaN(totalAmount)) return;

    // 'add' operation: Subtract from FROM, Add to TO
    // 'subtract' operation: Add to FROM, Subtract from TO (reversal)
    const fromAdjustment = operation === 'add' ? -totalAmount : totalAmount; 
    const toAdjustment = operation === 'add' ? totalAmount : -totalAmount; 

    if (fromLedgerId) {
      await this.ledgerService.adjustBalance(client, fromLedgerId, tenantId, fromAdjustment);
    }
    if (toLedgerId) {
      await this.ledgerService.adjustBalance(client, toLedgerId, tenantId, toAdjustment);
    }
  }

  async _updateInvoicePayments(client, transactions, operation = 'add') {
    if (!transactions || transactions.length === 0) return;

    for (const transaction of transactions) {
      const amount = operation === 'add' 
        ? parseFloat(transaction.received_amount)
        : -parseFloat(transaction.received_amount);
      
      if (isNaN(amount)) continue;

      // MODIFICATION: Call the appropriate SERVICE method
      switch (transaction.invoice_type) {
        case 'SALE':
          await this.salesService.updatePaymentAndStatus(client, transaction.invoice_id, amount);
          break;
        case 'PURCHASE':
          await this.purchaseService.updatePaymentAndStatus(client, transaction.invoice_id, amount);
          break;
        case 'SALERETURN':
          await this.saleReturnService.updatePaymentAndStatus(client, transaction.invoice_id, amount);
          break;
        case 'PURCHASERETURN':
          await this.purchaseReturnService.updatePaymentAndStatus(client, transaction.invoice_id, amount);
          break;
        default:
          console.warn(`Unknown invoice type for payment update: ${transaction.invoice_type}`);
      }
    }
  }

  async create(user, voucherData, db) {
    const { transactions, ...voucherDetails } = voucherData;
    const voucherPayload = {
      ...voucherDetails,
      tenant_id: user.tenant_id,
      date: voucherDetails.date || new Date(),
    };
    const totalVoucherAmount = parseFloat(voucherData.amount);

    const client = await db.connect();
   try {
      await client.query("BEGIN");
      const newVoucher = await this.repository.create(client, voucherPayload);
      await this.voucherTransactionsService.createMany(client, newVoucher.id, transactions);
      await this._updateInvoicePayments(client, transactions, 'add');
      
      // NEW: Ledger balance update on creation
      await this._updateLedgerBalances(
          client, 
          voucherData.from_ledger.ledger_id, 
          voucherData.to_ledger.ledger_id, 
          user.tenant_id, 
          totalVoucherAmount,
          'add'
      );

      await client.query("COMMIT");
      return this.repository.getById(db, newVoucher.id, user.tenant_id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id, user, voucherData, db) {
    const tenantId = user.tenant_id;
    const existingVoucher = await this.repository.getById(db, id, tenantId);
    if (!existingVoucher) {
      throw new Error("Voucher not found or not authorized to update");
    }

    // Store old values for reversal
    const oldFromLedgerId = existingVoucher.from_ledger_id;
    const oldToLedgerId = existingVoucher.to_ledger_id;
    const oldAmount = existingVoucher.amount;

    const { transactions: newTransactions, ...voucherDetails } = voucherData;
    const newFromLedgerId = voucherData.from_ledger.ledger_id;
    const newToLedgerId = voucherData.to_ledger.ledger_id;
    const newAmount = parseFloat(voucherData.amount);

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      // 1. Reverse old ledger and invoice payments
      await this._updateInvoicePayments(client, existingVoucher.transactions, 'subtract');
      // NEW: Reverse old ledger balance
      await this._updateLedgerBalances(
        client, 
        oldFromLedgerId, 
        oldToLedgerId, 
        tenantId, 
        oldAmount,
        'subtract' // Reverse the original effect
      );
      
      await this.repository.update(client, id, tenantId, voucherDetails);
      await this.voucherTransactionsService.deleteByVoucherId(client, id);
      await this.voucherTransactionsService.createMany(client, id, newTransactions);
      
      // 2. Apply new ledger and invoice payments
      await this._updateInvoicePayments(client, newTransactions, 'add');
      // NEW: Apply new ledger balance
      await this._updateLedgerBalances(
          client, 
          newFromLedgerId, 
          newToLedgerId, 
          tenantId, 
          newAmount,
          'add' // Apply the new effect
      );

      await client.query("COMMIT");
      return this.repository.getById(db, id, tenantId);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

async delete(id, user, db) {
    const tenantId = user.tenant_id;
    const voucherToDelete = await this.repository.getById(db, id, tenantId);
    if (!voucherToDelete) {
      throw new Error("Voucher not found or not authorized");
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");
      
      await this._updateInvoicePayments(client, voucherToDelete.transactions, 'subtract');
      
      // NEW: Reverse ledger balance
      await this._updateLedgerBalances(
        client, 
        voucherToDelete.from_ledger_id, 
        voucherToDelete.to_ledger_id, 
        tenantId, 
        voucherToDelete.amount,
        'subtract' // Reverse the original effect
      );

      const deletedVoucher = await this.repository.delete(client, id, tenantId);
      
      await client.query("COMMIT");
      if (!deletedVoucher) {
        throw new Error("Failed to delete voucher");
      }
      return deletedVoucher;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getById(id, tenantId, db) {
    const voucher = await this.repository.getById(db, id, tenantId);
    if (!voucher) throw new Error("Voucher not found or not authorized");
    return voucher;
  }

  async getAll(tenantId, filters, db) {
    return this.repository.getAll(db, tenantId, filters);
  }
  async getPaginated(tenantId, filters, db) {
    const { vouchers, totalCount, total_amount } =
      await this.repository.getPaginated(db, tenantId, filters);

    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10;
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
    const totalAmount = parseFloat(total_amount || 0);

    return {
      data: vouchers,
      count: totalCount,
      page_count,
      total_amount: totalAmount,
    };
  }
}

module.exports = VoucherService;