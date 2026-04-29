const ItemRepository = require('../item/item.repository')

class SalesService {
  constructor(repository, itemRepository, voucherService) {
    this.repository = repository
    this.itemRepository = itemRepository || new ItemRepository()
    this.voucherService = voucherService
  }

  async getAll(tenantId, filters, db) {
    const rows = await this.repository.getByUserId(db, tenantId, filters)
    return rows.map((sale) => ({
      ...sale,
      // pg returns json_agg as a real array; handle both array and string cases
      payment_methods: Array.isArray(sale.payment_methods)
        ? sale.payment_methods
        : typeof sale.payment_methods === 'string'
          ? JSON.parse(sale.payment_methods || '[]')
          : (sale.payment_methods || []),
    }))
  }

  async _processSaleItems(items, tenantId, db) {
    if (!items || items.length === 0) {
      return []
    }
    const itemIds = items.map((item) => item.item_id)
    const dbItems = await this.itemRepository.getByIds(db, itemIds, tenantId)

    if (dbItems.length !== itemIds.length) {
      const foundItemIds = dbItems.map((item) => item.id)
      const missingIds = itemIds.filter((id) => !foundItemIds.includes(id))
      throw new Error(
        `One or more items not found. Could not find item IDs: ${missingIds.join(
          ', ',
        )} for tenant ${tenantId}`,
      )
    }

    return items.map((item) => {
      const dbItem = dbItems.find((i) => i.id === item.item_id)
      if (dbItem.stock_quantity < item.quantity) {
        throw new Error(`Not enough stock for item: ${dbItem.name}.`)
      }
      const basePrice = item.quantity * item.unit_price
      const taxAmount = (basePrice * (parseFloat(dbItem.tax) || 0)) / 100
      const totalPrice = basePrice + taxAmount
      return { ...item, tax_amount: taxAmount, total_price: totalPrice }
    })
  }

  _deduplicateAndCleanItems(items) {
    const uniqueItemsMap = new Map()
    items.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0
      if (quantity <= 0) return

      if (uniqueItemsMap.has(item.item_id)) {
        uniqueItemsMap.get(item.item_id).quantity += quantity
      } else {
        uniqueItemsMap.set(item.item_id, { ...item, quantity })
      }
    })
    return Array.from(uniqueItemsMap.values())
  }

async create(user, saleData, db) {
    const tenantId = user.tenant_id
    const {
      items,
      discount = 0,
      payment_methods = [],
      note = null,
      ledger_id = null,
      change_return = 0,
      ...saleDetails
    } = saleData

    // 1. Deduplicate and clean input items
    const uniqueInputItems = this._deduplicateAndCleanItems(items)

    // 2. Process unique items
    const itemsWithDetails = await this._processSaleItems(
      uniqueInputItems,
      tenantId,
      db,
    )

    const itemsSubtotal = itemsWithDetails.reduce(
      (sum, item) => sum + item.total_price,
      0,
    )
    const grandTotal = itemsSubtotal - parseFloat(discount)

    // --- FIX: Calculate total paid amount and status before creating the sale ---
    const totalPaid = payment_methods.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    let status = 'unpaid';
    if (totalPaid >= grandTotal) {
        status = 'paid';
    } else if (totalPaid > 0) {
        status = 'partial';
    }

    // Filter valid payments (for vouchers)
    const validPayments = payment_methods
      .map((p) => ({
        account_id: p.account_id,
        amount: parseFloat(p.amount) || 0,
        mode_of_payment_id: p.mode_of_payment_id,
      }))
      .filter((p) => p.amount !== 0 && p.account_id)

    const salePayload = {
      ...saleDetails,
      tenant_id: tenantId,
      ledger_id,
      discount: parseFloat(discount),
      total_amount: grandTotal,
      paid_amount: 0,       // voucherService.create() will increment this via updatePaymentAndStatus
      status: 'unpaid',     // same - will be updated after each voucher is created
      change_return: parseFloat(change_return),
      date: saleDetails.date || new Date(),
      note,
    }

    // 3. Create Sale (With correct initial totals)
    const newSales = await this.repository.create(
      db,
      salePayload,
      itemsWithDetails,
    )

    // 4. Update Stock
    for (const item of itemsWithDetails) {
      await this.itemRepository.updateStock(db, item.item_id, -item.quantity)
    }

    // 5. Create Vouchers for Payments
    if (newSales && validPayments.length > 0) {
      await this._processVouchersForPayments(newSales, user, validPayments, db)
    }

    const result = await this.getById(newSales.id, tenantId, db)
    return {
      status: 'success',
      data: result,
    }
  }

async update(id, user, saleData, db) {
    const tenantId = user.tenant_id

    // 1. Fetch Original Sale
    const originalSale = await this.getById(id, tenantId, db)
    if (!originalSale) {
      throw new Error('Sale not found or not authorized to update')
    }

    const {
      items: updatedItems,
      discount = 0,
      payment_methods = [],
      note,
      ledger_id = null,
      change_return = 0,
      ...saleDetails
    } = saleData

    const uniqueInputItems = this._deduplicateAndCleanItems(updatedItems)
    const itemsWithDetails = await this._processSaleItems(uniqueInputItems, tenantId, db)

    const itemsSubtotal = itemsWithDetails.reduce((sum, item) => sum + item.total_price, 0)
    const grandTotal = itemsSubtotal - parseFloat(discount)

    // --- FIX: Calculate total paid and status for the update payload ---
    const totalPaid = payment_methods.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
    let status = 'unpaid';
    if (totalPaid >= grandTotal) {
        status = 'paid';
    } else if (totalPaid > 0) {
        status = 'partial';
    }

    // 2. Handle Payment Methods (Sync Vouchers)
    const validIncomingPayments = (payment_methods || [])
      .map((p) => ({
        account_id: p.account_id,
        amount: parseFloat(p.amount) || 0,
        mode_of_payment_id: p.mode_of_payment_id,
        voucher_id: p.voucher_id ? Number(p.voucher_id) : null,
        voucher_no: p.voucher_no,
      }))
      .filter((p) => p.amount !== 0 && p.account_id)

    const incomingVoucherIds = new Set(
      validIncomingPayments
        .map((p) => p.voucher_id)
        .filter((id) => id != null)
    )
    const existingVouchers = originalSale.payment_methods || []

    for (const existingVoucher of existingVouchers) {
      if (existingVoucher.voucher_id && !incomingVoucherIds.has(Number(existingVoucher.voucher_id))) {
        try {
          await this.voucherService.delete(existingVoucher.voucher_id, user, db)
        } catch (err) {
          console.error(`Cleanup failed for voucher ${existingVoucher.voucher_id}:`, err.message)
        }
      }
    }

    const salePayload = {
      ...saleDetails,
      ledger_id,
      discount: parseFloat(discount),
      total_amount: grandTotal,
      paid_amount: originalSale.paid_amount || 0, 
      status: status, // Use newly calculated status
      change_return: parseFloat(change_return),
      note: note !== undefined ? note : originalSale.note,
    }

    // Calculate Stock Differences
    const originalItemQuantities = new Map((originalSale.items || []).map((item) => [item.item_id, item.quantity]))
    const updatedItemQuantities = new Map((itemsWithDetails || []).map((item) => [item.item_id, item.quantity]))

    const stockAdjustments = new Map()
    const allItemIds = new Set([...originalItemQuantities.keys(), ...updatedItemQuantities.keys()])

    for (const itemId of allItemIds) {
      const originalQty = originalItemQuantities.get(itemId) || 0
      const updatedQty = updatedItemQuantities.get(itemId) || 0
      const difference = originalQty - updatedQty

      if (difference !== 0) {
        stockAdjustments.set(itemId, difference)
      }
    }

    // 3. Update Sale Details (Now includes paid_amount and status)
    const updatedSales = await this.repository.update(db, id, tenantId, salePayload, itemsWithDetails)

    if (!updatedSales) {
      throw new Error('Failed to update the sale.')
    }

    // 4. Adjust Stock
    for (const [itemId, quantityChange] of stockAdjustments.entries()) {
      await this.itemRepository.updateStock(db, itemId, quantityChange)
    }

    // 5. Process Create/Update for incoming payments
    if (updatedSales && validIncomingPayments.length > 0) {
      await this._processVouchersForPayments(updatedSales, user, validIncomingPayments, db)
    }

    // 6. Final Reconciliation: Ensure paid_amount is exactly the sum of vouchers
    await this.repository.reconcilePaidAmount(db, id)

    const result = await this.getById(id, tenantId, db)
    return {
      status: 'success',
      data: result,
    }
  }

  // Renamed from _createVouchersForPayments to reflect dual purpose (create & update)
  async _processVouchersForPayments(sale, user, payment_methods, db) {
    if (!sale.party_ledger_id) {
      throw new Error(
        `The customer '${sale.party_name}' does not have a linked Ledger account.`,
      )
    }

    for (const payment of payment_methods) {
      const amount = parseFloat(payment.amount)
      if (amount === 0) continue

      const isReceipt = amount > 0
      const absAmount = Math.abs(amount)

      const voucherData = {
        tenant_id: user.tenant_id,
        amount: absAmount,
        date: sale.date,
        description: `Payment for Sale Invoice #${sale.invoice_number}`,
        // Keep existing number if updating, otherwise generate new one
        voucher_no:
          payment.voucher_no ||
          `VS-${sale.invoice_number}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,

        voucher_type: isReceipt ? 1 : 0,

        from_ledger: {
          ledger_id: isReceipt ? sale.party_ledger_id : payment.account_id,
        },
        to_ledger: {
          ledger_id: isReceipt ? payment.account_id : sale.party_ledger_id,
        },

        cost_center_id: sale.cost_center_id,
        done_by_id: sale.done_by_id,
        mode_of_payment_id: payment.mode_of_payment_id,

        transactions: [
          {
            invoice_id: sale.id,
            invoice_type: 'SALE',
            received_amount: amount,
          },
        ],
      }

      if (payment.voucher_id) {
        try {
          // UPDATE existing voucher
          await this.voucherService.update(
            payment.voucher_id,
            user,
            voucherData,
            db,
          )
        } catch (err) {
          if (err.message.includes('Voucher not found')) {
            console.warn(`Voucher ${payment.voucher_id} not found, creating a new one instead.`);
            await this.voucherService.create(user, voucherData, db);
          } else {
            throw err;
          }
        }
      } else {
        // CREATE new voucher
        await this.voucherService.create(user, voucherData, db)
      }
    }
  }

  async updatePaymentAndStatus(client, saleId, amountChange) {
    return this.repository.updatePaymentAndStatus(client, saleId, amountChange)
  }

  async getPaginatedBytenantId(tenantId, filters, db) {
    const { sales, totalCount, total_amount, paid_amount } =
      await this.repository.getPaginatedBytenantId(db, tenantId, filters)

    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0

    const totalAmount = parseFloat(total_amount || 0)
    const paidAmount = parseFloat(paid_amount || 0)
    const pending_amount = totalAmount - paidAmount

    // Parse payment_methods: pg returns json_agg as a real array; handle both array and string
    const parsedSales = sales.map((sale) => ({
      ...sale,
      payment_methods: Array.isArray(sale.payment_methods)
        ? sale.payment_methods
        : typeof sale.payment_methods === 'string'
          ? JSON.parse(sale.payment_methods || '[]')
          : (sale.payment_methods || []),
    }))

    return {
      data: parsedSales,
      count: totalCount,
      page_count,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      pending_amount,
    }
  }

  _normalizeImageUrl(url) {
    if (typeof url !== 'string') return url
    if (url.startsWith('//')) url = url.replace(/^\/+/, '/')
    url = url.replace(/\s/g, '%20')
    if (url.includes('inventoryx'))
      url = url.replace(/inventoryx/g, 'inventoryx')
    return url
  }

  async getById(id, tenantId, db) {
    const sales = await this.repository.getById(db, id, tenantId)
    if (!sales) throw new Error('Sales not found or not authorized')
    // Fix //uploads/... from legacy data so images load (browsers treat // as protocol-relative)
    if (sales.store) {
      if (sales.store.header_image_url)
        sales.store.header_image_url = this._normalizeImageUrl(
          sales.store.header_image_url,
        )
      if (sales.store.full_header_image_url)
        sales.store.full_header_image_url = this._normalizeImageUrl(
          sales.store.full_header_image_url,
        )
    }
    return {
      ...sales,
      items:
        typeof sales.items === 'string'
          ? JSON.parse(sales.items || '[]')
          : sales.items || [],
      payment_methods:
        typeof sales.payment_methods === 'string'
          ? JSON.parse(sales.payment_methods || '[]')
          : sales.payment_methods || [],
    }
  }

  // api/sales/sales.service.js

  async delete(id, user, db) {
    const tenantId = user.tenant_id
    const saleToDelete = await this.getById(id, tenantId, db)

    if (!saleToDelete) throw new Error('Sale not found')

    const client = await db.connect()
    try {
      await client.query('BEGIN')

      // 1. Delete associated Vouchers (and their transactions/ledger entries)
      if (
        saleToDelete.payment_methods &&
        Array.isArray(saleToDelete.payment_methods)
      ) {
        for (const payment of saleToDelete.payment_methods) {
          // We pass 'client' so it uses the same transaction
          await this.voucherService.delete(payment.voucher_id, user, db, client)
        }
      }

      // 2. Adjust Stock: Restore the items to stock before deleting the sale
      // Assuming saleToDelete.items is a JSON string or array
      const items =
        typeof saleToDelete.items === 'string'
          ? JSON.parse(saleToDelete.items)
          : saleToDelete.items

      if (items) {
        for (const item of items) {
          await this.itemRepository.updateStock(
            client,
            item.item_id,
            item.quantity,
          )
        }
      }

      // 3. Delete Sales Items (if not already handled by ON DELETE CASCADE)
      // IMPORTANT: If your DB schema doesn't have ON DELETE CASCADE,
      // you MUST delete from 'sale_item' table here.
      await client.query('DELETE FROM sale_item WHERE sales_id = $1', [id])

      // 4. Delete the actual Sale
      await this.repository.delete(client, id, tenantId)

      await client.query('COMMIT')
      return { status: 'success' }
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('❌ Delete Sale Error:', error.message)
      throw error
    } finally {
      client.release()
    }
  }
}

module.exports = SalesService
