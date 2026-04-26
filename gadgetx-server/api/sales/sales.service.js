const ItemRepository = require("../item/item.repository");

class SalesService {
  constructor(repository, itemRepository, voucherService) {
    this.repository = repository;
    this.itemRepository = itemRepository || new ItemRepository();
    this.voucherService = voucherService;
  }

  async getAll(tenantId, filters, db) {
    return await this.repository.getByUserId(db, tenantId, filters);
  }

  async _processSaleItems(items, tenantId, db) {
    if (!items || items.length === 0) {
      return [];
    }
    const itemIds = items.map((item) => item.item_id);
    const dbItems = await this.itemRepository.getByIds(db, itemIds, tenantId);

    if (dbItems.length !== itemIds.length) {
      const foundItemIds = dbItems.map((item) => item.id);
      const missingIds = itemIds.filter((id) => !foundItemIds.includes(id));
      throw new Error(
        `One or more items not found. Could not find item IDs: ${missingIds.join(
          ", "
        )} for tenant ${tenantId}`
      );
    }

    return items.map((item) => {
      const dbItem = dbItems.find((i) => i.id === item.item_id);
      if (dbItem.stock_quantity < item.quantity) {
        throw new Error(`Not enough stock for item: ${dbItem.name}.`);
      }
      const basePrice = item.quantity * item.unit_price;
      const taxAmount = (basePrice * (parseFloat(dbItem.tax) || 0)) / 100;
      const totalPrice = basePrice + taxAmount;
      return { ...item, tax_amount: taxAmount, total_price: totalPrice };
    });
  }

  _deduplicateAndCleanItems(items) {
    const uniqueItemsMap = new Map();
    items.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      if (quantity <= 0) return;

      if (uniqueItemsMap.has(item.item_id)) {
        uniqueItemsMap.get(item.item_id).quantity += quantity;
      } else {
        uniqueItemsMap.set(item.item_id, { ...item, quantity });
      }
    });
    return Array.from(uniqueItemsMap.values());
  }

  async create(user, saleData, db) {
    const tenantId = user.tenant_id;
    const {
      items,
      discount = 0,
      payment_methods = [],
      note = null,
      account_id = null,
      change_return = 0,
      ...saleDetails
    } = saleData;

    // 1. Deduplicate and clean input items
    const uniqueInputItems = this._deduplicateAndCleanItems(items);

    // 2. Process unique items
    const itemsWithDetails = await this._processSaleItems(
      uniqueInputItems,
      tenantId,
      db
    );

    const itemsSubtotal = itemsWithDetails.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const grandTotal = itemsSubtotal - parseFloat(discount);

    // Filter valid payments (for vouchers)
    const validPayments = payment_methods
      .map((p) => ({
        account_id: p.account_id,
        amount: parseFloat(p.amount) || 0,
        mode_of_payment_id: p.mode_of_payment_id,
      }))
      .filter((p) => p.amount !== 0 && p.account_id);

    // Note: paid_amount is initially 0, updated by VoucherService later
    const salePayload = {
      ...saleDetails,
      tenant_id: tenantId,
      account_id,
      discount: parseFloat(discount),
      total_amount: grandTotal,
      change_return: parseFloat(change_return),
      date: saleDetails.date || new Date(),
      note,
    };

    // 3. Create Sale (Unpaid)
    const newSales = await this.repository.create(
      db,
      salePayload,
      itemsWithDetails
    );

    // 4. Update Stock
    for (const item of itemsWithDetails) {
      await this.itemRepository.updateStock(db, item.item_id, -item.quantity);
    }

    // 5. Create Vouchers for Payments
    if (newSales && validPayments.length > 0) {
      await this._createVouchersForPayments(newSales, user, validPayments, db);
    }

    return this.getById(newSales.id, tenantId, db);
  }

  async update(id, user, saleData, db) {
    const tenantId = user.tenant_id;
    const originalSale = await this.repository.getById(db, id, tenantId);
    if (!originalSale) {
      throw new Error("Sale not found or not authorized to update");
    }

    const {
      items: updatedItems,
      discount = 0,
      payment_methods = [],
      note = null,
      account_id = null,
      change_return = 0,
      ...saleDetails
    } = saleData;

    const uniqueInputItems = this._deduplicateAndCleanItems(updatedItems);

    const itemsWithDetails = await this._processSaleItems(
      uniqueInputItems,
      tenantId,
      db
    );

    const itemsSubtotal = itemsWithDetails.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const grandTotal = itemsSubtotal - parseFloat(discount);

    const validPayments = payment_methods
      .map((p) => ({
        account_id: p.account_id,
        amount: parseFloat(p.amount) || 0,
        mode_of_payment_id: p.mode_of_payment_id,
      }))
      .filter((p) => p.amount !== 0 && p.account_id);


    const salePayload = {
      ...saleDetails,
      account_id,
      discount: parseFloat(discount),
      total_amount: grandTotal,
      change_return: parseFloat(change_return),
      note,
    };

    // Calculate Stock Differences
    const originalItemQuantities = new Map(
      (originalSale.items || []).map((item) => [item.item_id, item.quantity])
    );
    const updatedItemQuantities = new Map(
      (itemsWithDetails || []).map((item) => [item.item_id, item.quantity])
    );

    const stockAdjustments = new Map();
    const allItemIds = new Set([
      ...originalItemQuantities.keys(),
      ...updatedItemQuantities.keys(),
    ]);

    for (const itemId of allItemIds) {
      const originalQty = originalItemQuantities.get(itemId) || 0;
      const updatedQty = updatedItemQuantities.get(itemId) || 0;
      const difference = originalQty - updatedQty; // + means return to stock (orig > updated), - means take from stock

      if (difference !== 0) {
        stockAdjustments.set(itemId, difference);
      }
    }

    // 1. Update Sale Details
    const updatedSales = await this.repository.update(
      db,
      id,
      tenantId,
      salePayload,
      itemsWithDetails
    );

    if (!updatedSales) {
      throw new Error("Failed to update the sale.");
    }

    // 2. Adjust Stock
    for (const [itemId, quantityChange] of stockAdjustments.entries()) {
      await this.itemRepository.updateStock(db, itemId, quantityChange);
    }

    // 3. Process New Payments
    if (updatedSales && validPayments.length > 0) {
       await this._createVouchersForPayments(updatedSales, user, validPayments, db);
    }

    return this.getById(id, tenantId, db);
  }

  async _createVouchersForPayments(sale, user, payment_methods, db) {
    if (!sale.party_ledger_id) {
       throw new Error(`The customer '${sale.party_name}' does not have a linked Ledger account.`);
    }

    for (const payment of payment_methods) {
      const amount = parseFloat(payment.amount);
      if (amount === 0) continue;

      const isReceipt = amount > 0;
      const absAmount = Math.abs(amount);

      const voucherData = {
        tenant_id: user.tenant_id,
        amount: absAmount,
        date: sale.date,
        description: `Payment for Sale Invoice #${sale.invoice_number}`,
        voucher_no: `VS-${sale.invoice_number}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        
       voucher_type: isReceipt ? 1 : 0, 
        
      from_ledger: { ledger_id: isReceipt ? sale.party_ledger_id : payment.account_id }, 
        to_ledger: { ledger_id: isReceipt ? payment.account_id : sale.party_ledger_id },
        
        cost_center_id: sale.cost_center_id,
        done_by_id: sale.done_by_id,
        mode_of_payment_id: payment.mode_of_payment_id,
        
        transactions: [{
             invoice_id: sale.id,
             invoice_type: 'SALE',
             received_amount: amount 
        }]
      };

      await this.voucherService.create(user, voucherData, db);
    }
  }

  async updatePaymentAndStatus(client, saleId, amountChange) {
    return this.repository.updatePaymentAndStatus(client, saleId, amountChange);
  }

  async getPaginatedBytenantId(tenantId, filters, db) {
    const { sales, totalCount, total_amount, paid_amount } =
      await this.repository.getPaginatedBytenantId(db, tenantId, filters);

    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10;
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

    const totalAmount = parseFloat(total_amount || 0);
    const paidAmount = parseFloat(paid_amount || 0);
    const pending_amount = totalAmount - paidAmount;

    return {
      data: sales,
      count: totalCount,
      page_count,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount,
    };
  }

  async getById(id, tenantId, db) {
    const sales = await this.repository.getById(db, id, tenantId);
    if (!sales) throw new Error("Sales not found or not authorized");
    return sales;
  }

  async delete(id, user, db) {
    const tenantId = user.tenant_id;
    const saleToDelete = await this.repository.getById(db, id, tenantId);
    if (!saleToDelete) {
      throw new Error("Sale not found or not authorized");
    }

    const client = await db.connect();
    try {
      await client.query("BEGIN");

      const deletedSales = await this.repository.delete(client, id, tenantId);
      if (!deletedSales) {
        throw new Error("Sales not found or not authorized to delete");
      }

      for (const item of saleToDelete.items) {
        await this.itemRepository.updateStock(
          client,
          item.item_id,
          item.quantity 
        );
      }
      await client.query("COMMIT");
      return deletedSales;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = SalesService;