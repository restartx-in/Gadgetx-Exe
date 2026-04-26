class PurchaseService {
  // Inject VoucherService
  constructor(repository, itemRepository, voucherService) {
    this.repository = repository;
    this.itemRepository = itemRepository;
    this.voucherService = voucherService;
  }

  async create(user, purchaseData, db) {
    const tenantId = user.tenant_id;
    const {
      items,
      discount = 0,
      payment_methods = [],
      ...purchaseDetails
    } = purchaseData;

    const itemsWithDetails = await this._processPurchaseItems(items, tenantId, db);
    const itemsSubtotal = itemsWithDetails.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const grandTotal = itemsSubtotal - parseFloat(discount);

    const purchasePayload = {
      ...purchaseDetails,
      tenant_id: tenantId,
      discount: parseFloat(discount),
      total_amount: grandTotal,
      // Status and Paid Amount are handled by vouchers now
      date: purchaseDetails.date || new Date(),
    };
    
    // 1. Create Purchase (Initial status: Unpaid)
    const newPurchase = await this.repository.create(
      db,
      purchasePayload,
      itemsWithDetails
    );

    // 2. Update Stock
    for (const item of itemsWithDetails) {
      await this.itemRepository.updateStock(db, item.item_id, item.quantity);
    }

    // 3. Process Payments (Create Vouchers)
    // The VoucherService will callback updatePaymentAndStatus to update the purchase status
    const positivePayments = payment_methods.filter(p => parseFloat(p.amount) > 0);
    if (newPurchase && positivePayments.length > 0) {
      await this._createVouchersForPayments(newPurchase, user, positivePayments, db);
    }

    return this.getById(newPurchase.id, tenantId, db);
  }

  async update(id, user, purchaseData, db) {
    const tenantId = user.tenant_id;
    const originalPurchase = await this.repository.getById(db, id, tenantId);
    if (!originalPurchase) {
      throw new Error('Purchase not found or not authorized to update');
    }

    const {
      items: updatedItems,
      discount = 0,
      payment_methods = [],
      ...purchaseDetails
    } = purchaseData;

    const itemsWithDetails = await this._processPurchaseItems(
      updatedItems,
      tenantId,
      db
    );
    const itemsSubtotal = itemsWithDetails.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const grandTotal = itemsSubtotal - parseFloat(discount);

    const purchasePayload = {
      ...purchaseDetails,
      discount: parseFloat(discount),
      total_amount: grandTotal,
    };

    // Calculate Stock Differences
    const stockAdjustments = new Map();
    const originalItemQuantities = new Map(
      originalPurchase.items?.map((item) => [item.item_id, item.quantity]) || []
    );
    const updatedItemQuantities = new Map(
      updatedItems.map((item) => [item.item_id, item.quantity])
    );
    const allItemIds = new Set([
      ...originalItemQuantities.keys(),
      ...updatedItemQuantities.keys(),
    ]);

    for (const itemId of allItemIds) {
      const originalQty = originalItemQuantities.get(itemId) || 0;
      const updatedQty = updatedItemQuantities.get(itemId) || 0;
      const difference = updatedQty - originalQty;
      if (difference !== 0) {
        stockAdjustments.set(itemId, difference);
      }
    }

    // 1. Update Purchase Details (Header + Items)
    const updatedPurchase = await this.repository.update(
      db,
      id,
      tenantId,
      purchasePayload,
      itemsWithDetails
    );

    // 2. Adjust Stock
    for (const [itemId, quantityChange] of stockAdjustments.entries()) {
      await this.itemRepository.updateStock(db, itemId, quantityChange);
    }
    
    // 3. Process New Payments if any
    const positivePayments = payment_methods.filter(p => parseFloat(p.amount) > 0);
    if (updatedPurchase && positivePayments.length > 0) {
       await this._createVouchersForPayments(updatedPurchase, user, positivePayments, db);
    }

    return this.getById(id, tenantId, db);
  }

  // Helper: Create Vouchers instead of Transaction Entries
  async _createVouchersForPayments(purchase, user, payment_methods, db) {
    // <<< VALIDATION: Check if Party has a linked Ledger
    if (!purchase.party_ledger_id) {
        throw new Error(`The supplier '${purchase.party_name}' (ID: ${purchase.party_id}) does not have a linked Ledger account. Please update the supplier with a valid ledger.`);
    }

    for (const payment of payment_methods) {
      const amount = parseFloat(payment.amount);
      if (amount <= 0) continue;

      const voucherData = {
        tenant_id: user.tenant_id,
        amount: amount,
        date: purchase.date,
        description: `Payment for Purchase Invoice #${purchase.invoice_number}`,
        voucher_no: `VP-${purchase.invoice_number}-${Date.now()}`,
        voucher_type: 0, // 0 = Paid (Money Out)
        
        // FROM: The Asset/Bank Account selected in UI
        from_ledger: { ledger_id: payment.account_id }, 
        
        // TO: The Supplier's Ledger (NOT Party ID)
        to_ledger: { ledger_id: purchase.party_ledger_id }, 
        
        cost_center_id: purchase.cost_center_id,
        done_by_id: purchase.done_by_id,
        mode_of_payment_id: payment.mode_of_payment_id,
        
        // Link Transaction to this Purchase
        transactions: [{
             invoice_id: purchase.id,
             invoice_type: 'PURCHASE',
             received_amount: amount
        }]
      };

      // Create Voucher
      await this.voucherService.create(user, voucherData, db);
    }
  }

  async updatePaymentAndStatus(client, purchaseId, amountChange) {
    return this.repository.updatePaymentAndStatus(client, purchaseId, amountChange);
  }

  async delete(id, user, db) {
    const tenantId = user.tenant_id;
    const purchaseToDelete = await this.repository.getById(db, id, tenantId);
    if (!purchaseToDelete) throw new Error('Purchase not found or not authorized');

    const deletedPurchase = await this.repository.delete(db, id, tenantId);

    // Return stock
    if (Array.isArray(purchaseToDelete.items) && purchaseToDelete.items.length > 0) {
      for (const item of purchaseToDelete.items) {
        await this.itemRepository.updateStock(db, item.item_id, -item.quantity);
      }
    }
  }

  async getAll(tenantId, filters, db) {
    return this.repository.getByUserId(db, tenantId, filters);
  }

  async getPaginatedByUserId(tenantId, filters, db) {
    const { purchases, totalCount, total_amount, paid_amount } =
      await this.repository.getPaginatedByUserId(db, tenantId, filters);

    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10;
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
    const totalAmount = parseFloat(total_amount || 0);
    const paidAmount = parseFloat(paid_amount || 0);
    const pending_amount = totalAmount - paidAmount;

    return {
      data: purchases,
      count: totalCount,
      page_count,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount,
    };
  }

  async getById(id, tenantId, db) {
    const purchase = await this.repository.getById(db, id, tenantId);
    if (!purchase) throw new Error('Purchase not found or not authorized');
    return purchase;
  }

  async _processPurchaseItems(items, tenantId, db) { 
    const itemIds = items.map((item) => item.item_id);
    const dbItems = await this.itemRepository.getByIds(db, itemIds, tenantId);
    if (dbItems.length !== itemIds.length)
      throw new Error('One or more items not found.');

    return items.map((item) => {
      const dbItem = dbItems.find((i) => i.id === item.item_id);
      const basePrice = item.quantity * item.unit_price;
      const taxAmount = (basePrice * (parseFloat(dbItem.tax) || 0)) / 100;
      const totalPrice = basePrice + taxAmount;
      return { ...item, tax_amount: taxAmount, total_price: totalPrice };
    });
  }
}

module.exports = PurchaseService;