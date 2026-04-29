const SalesItemRepository = require('../saleItem/saleItem.repository')

class SalesRepository {
  constructor() {
    this.salesItemRepository = new SalesItemRepository()
  }

  async getByUserId(db, tenantId, filters = {}) {
    const { sort, searchType, searchKey, ids, ...otherFilters } = filters 
    
    let query = `
            SELECT 
                s.*,
                p.name as party_name,
                p.ledger_id as party_ledger_id, -- Fetch Ledger ID
                db.name as done_by_name,      
                cc.name as cost_center_name,
                l.name as ledger_name,
                COALESCE(
                  (
                    SELECT json_group_array(
                      json_object(
                        'voucher_id', pm.voucher_id,
                        'account_id', pm.to_ledger_id,
                        'account_name', pm.ledger_name,
                        'amount', pm.received_amount,
                        'mode_of_payment_id', pm.mode_of_payment_id
                      )
                    )
                    FROM (
                      SELECT v.id as voucher_id, v.to_ledger_id, l2.name as ledger_name,
                             vt.received_amount, v.mode_of_payment_id
                      FROM voucher_transactions vt
                      JOIN voucher v ON vt.voucher_id = v.id
                      JOIN ledger l2 ON v.to_ledger_id = l2.id
                      WHERE CAST(vt.invoice_id AS INTEGER) = s.id
                        AND vt.invoice_type = 'SALE'
                        AND v.tenant_id = $1
                        AND l2.name IS NOT NULL
                    ) pm
                  ),
                  '[]'
                ) as payment_methods
            FROM sales s
            JOIN party p ON s.party_id = p.id 
            LEFT JOIN "done_by" db ON s.done_by_id = db.id
            LEFT JOIN "cost_center" cc ON s.cost_center_id = cc.id
            LEFT JOIN ledger l ON s.ledger_id = l.id
            WHERE s.tenant_id = $1
        `
    const params = [tenantId]
    let paramIndex = 2

    const filterConfig = {
      status: { operator: '=', column: 's.status' },
      party_id: { operator: '=', column: 's.party_id' },
      done_by_id: { operator: '=', column: 's.done_by_id' },
      cost_center_id: { operator: '=', column: 's.cost_center_id' },
      min_total_amount: { operator: '>=', column: 's.total_amount' },
      max_total_amount: { operator: '<=', column: 's.total_amount' },
      min_paid_amount: { operator: '>=', column: 's.paid_amount' },
      max_paid_amount: { operator: '<=', column: 's.paid_amount' },
      start_date: { operator: '>=', column: 's.date' },
      end_date: { operator: '<=', column: 's.date' },
      party_name: { operator: 'LIKE', column: 'p.name', isString: true },
      total_amount: { operator: '=', column: 's.total_amount' },
      paid_amount: { operator: '=', column: 's.paid_amount' },
      balance: { operator: '=', column: '(s.total_amount - s.paid_amount)' },
      invoice_number: { operator: '=', column: 's.invoice_number' },
      is_online: { operator: '=', column: 's.is_online' },
      account_id: {}, 
    }

    Object.keys(otherFilters).forEach((key) => {
      if (
        otherFilters[key] != null &&
        otherFilters[key] !== '' &&
        filterConfig[key]
      ) {
        if (key === 'account_id') {
          query += ` AND EXISTS (
            SELECT 1 FROM voucher_transactions vt
            JOIN voucher v ON vt.voucher_id = v.id
            WHERE CAST(vt.invoice_id AS INTEGER) = s.id
            AND vt.invoice_type = 'SALE' 
            AND v.to_ledger_id = $${paramIndex++}
          )`
          params.push(otherFilters[key])
        } else if (key === 'status' && typeof otherFilters[key] === 'string' && otherFilters[key].includes(',')) {
          const statuses = otherFilters[key].split(',').map(s => s.trim());
          query += ` AND s.status IN (${statuses.map(() => `$${paramIndex++}`).join(',')})` 
          params.push(...statuses)
        } else {
          const { operator, column, isString } = filterConfig[key]
          let value = otherFilters[key]
          if (key === 'is_online' && typeof value === 'string') {
            if (value.toLowerCase() === 'online') value = true
            else if (value.toLowerCase() === 'offline') value = false
          }
          if (isString) {
            value = `%${value}%`
          }
          query += ` AND ${column} ${operator} $${paramIndex++}`
          params.push(value)
        }
      }
    })
    
    if (ids) {
        let idArray = [];
        if (Array.isArray(ids)) {
            idArray = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
        } else if (typeof ids === 'string') {
            idArray = ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }

        if (idArray.length > 0) {
            query += ` AND s.id IN (${idArray.map(() => `$${paramIndex++}`).join(',')})`; 
            params.push(...idArray);
        }
    }


    const searchConfig = {
      party_name: { operator: 'LIKE', column: 'p.name' },
      status: { operator: 'LIKE', column: 's.status' },
      total_amount: { operator: '=', column: 's.total_amount' },
      invoice_number: { operator: 'LIKE', column: 's.invoice_number' },
      done_by_name: { operator: 'LIKE', column: 'db.name' },
      cost_center_name: { operator: 'LIKE', column: 'cc.name' },
    }

    if (searchType && searchKey != null && searchKey !== '') {
      if (searchConfig[searchType]) {
        const { operator, column } = searchConfig[searchType]
        let value = operator === 'LIKE' ? `%${searchKey}%` : searchKey
        query += ` AND ${column} ${operator} $${paramIndex}`
        params.push(value)
        paramIndex++
      }
    }

    const allowedSortColumns = {
      date: 's.date',
      total_amount: 's.total_amount',
      party_name: 'p.name',
      status: 's.status',
      done_by: 'db.name',
      cost_center: 'cc.name',
      invoice_number: 's.invoice_number',
    }

    if (sort) {
      const direction = sort.startsWith('-') ? 'DESC' : 'ASC'
      const columnKey = sort.startsWith('-') ? sort.substring(1) : sort
      const dbColumn = allowedSortColumns[columnKey]
      if (dbColumn) {
        query += ` ORDER BY ${dbColumn} ${direction}, s.id DESC`
      } else {
        query += ' ORDER BY s.date DESC, s.id DESC'
      }
    } else {
      query += ' ORDER BY s.date DESC, s.id DESC'
    }

    const { rows } = await db.query(query, params)
    return rows
  }

  async getPaginatedBytenantId(db, tenantId, filters = {}) {
    const {
      page = 1,
      page_size = 10,
      sort,
      searchType,
      searchKey,
      ...otherFilters
    } = filters
    const limit = parseInt(page_size, 10)
    const offset = (parseInt(page, 10) - 1) * limit

    const fromAndJoins = `
        FROM sales s
        JOIN party p ON s.party_id = p.id 
        LEFT JOIN "done_by" db ON s.done_by_id = db.id
        LEFT JOIN "cost_center" cc ON s.cost_center_id = cc.id
        LEFT JOIN ledger l ON s.ledger_id = l.id
    `
    let whereClause = ` WHERE s.tenant_id = $1 `
    const params = [tenantId]
    let paramIndex = 2

    const filterConfig = {
      status: { operator: '=', column: 's.status' },
      party_id: { operator: '=', column: 's.party_id' },
      done_by_id: { operator: '=', column: 's.done_by_id' },
      cost_center_id: { operator: '=', column: 's.cost_center_id' },
      min_total_amount: { operator: '>=', column: 's.total_amount' },
      max_total_amount: { operator: '<=', column: 's.total_amount' },
      min_paid_amount: { operator: '>=', column: 's.paid_amount' },
      max_paid_amount: { operator: '<=', column: 's.paid_amount' },
      start_date: { operator: '>=', column: 's.date' },
      end_date: { operator: '<=', column: 's.date' },
      party_name: { operator: 'LIKE', column: 'p.name', isString: true },
      total_amount: { operator: '=', column: 's.total_amount' },
      paid_amount: { operator: '=', column: 's.paid_amount' },
      balance: { operator: '=', column: '(s.total_amount - s.paid_amount)' },
      invoice_number: { operator: '=', column: 's.invoice_number' },
      is_online: { operator: '=', column: 's.is_online' },
      account_id: {}, 
    }

    Object.keys(otherFilters).forEach((key) => {
      if (
        otherFilters[key] != null &&
        otherFilters[key] !== '' &&
        filterConfig[key]
      ) {
        if (key === 'account_id') {
          whereClause += ` AND EXISTS (
            SELECT 1 FROM voucher_transactions vt
            JOIN voucher v ON vt.voucher_id = v.id
            WHERE CAST(vt.invoice_id AS INTEGER) = s.id
            AND vt.invoice_type = 'SALE' 
            AND v.to_ledger_id = $${paramIndex++}
          )`
          params.push(otherFilters[key])
        } else if (key === 'status' && typeof otherFilters[key] === 'string' && otherFilters[key].includes(',')) {
           const statuses = otherFilters[key].split(',').map(s => s.trim());
           whereClause += ` AND s.status IN (${statuses.map(() => `$${paramIndex++}`).join(',')})`
           params.push(...statuses)
        } else {
          const { operator, column, isString } = filterConfig[key]
          let value = otherFilters[key]
          if (key === 'is_online' && typeof value === 'string') {
            if (value.toLowerCase() === 'online') value = true
            else if (value.toLowerCase() === 'offline') value = false
          }
          if (isString) {
            value = `%${value}%`
          }
          whereClause += ` AND ${column} ${operator} $${paramIndex++}`
          params.push(value)
        }
      }
    })
    
    // Search config
    const searchConfig = {
        party_name: { operator: 'LIKE', column: 'p.name' },
        status: { operator: 'LIKE', column: 's.status' },
        total_amount: { operator: '=', column: 's.total_amount' },
        invoice_number: { operator: 'LIKE', column: 's.invoice_number' },
        done_by_name: { operator: 'LIKE', column: 'db.name' },
        cost_center_name: { operator: 'LIKE', column: 'cc.name' },
      }
  
      if (searchType && searchKey != null && searchKey !== '') {
        if (searchConfig[searchType]) {
          const { operator, column } = searchConfig[searchType]
          let value = operator === 'LIKE' ? `%${searchKey}%` : searchKey
          whereClause += ` AND ${column} ${operator} $${paramIndex}`
          params.push(value)
          paramIndex++
        }
      }
  
      const aggregationQuery = `
          SELECT
              COUNT(*) as total_count,
              COALESCE(SUM(s.total_amount), 0) as total_amount,
              COALESCE(SUM(s.paid_amount), 0) as paid_amount
          ${fromAndJoins}
          ${whereClause}
      `
      let mainQuery = `
          SELECT 
              s.*,
              p.name as party_name,
              p.ledger_id as party_ledger_id, -- Fetch Ledger ID
              db.name as done_by_name,      
              cc.name as cost_center_name,
              l.name as ledger_name,
              COALESCE(
                (
                  SELECT json_group_array(
                    json_object(
                      'voucher_id', pm.voucher_id,
                      'account_id', pm.to_ledger_id,
                      'account_name', pm.ledger_name,
                      'amount', pm.received_amount,
                      'mode_of_payment_id', pm.mode_of_payment_id
                    )
                  )
                  FROM (
                    SELECT v.id as voucher_id, v.to_ledger_id, l2.name as ledger_name,
                           vt.received_amount, v.mode_of_payment_id
                    FROM voucher_transactions vt
                    JOIN voucher v ON vt.voucher_id = v.id
                    JOIN ledger l2 ON v.to_ledger_id = l2.id
                    WHERE CAST(vt.invoice_id AS INTEGER) = s.id
                      AND vt.invoice_type = 'SALE'
                      AND v.tenant_id = $1
                      AND l2.name IS NOT NULL
                  ) pm
                ),
                '[]'
              ) as payment_methods
          ${fromAndJoins}
          ${whereClause}
      `
  
      const allowedSortColumns = {
        date: 's.date',
        total_amount: 's.total_amount',
        party_name: 'p.name',
        status: 's.status',
        done_by: 'db.name',
        cost_center: 'cc.name',
        invoice_number: 's.invoice_number',
      }
  
      if (sort) {
        const direction = sort.startsWith('-') ? 'DESC' : 'ASC'
        const columnKey = sort.startsWith('-') ? sort.substring(1) : sort
        const dbColumn = allowedSortColumns[columnKey]
        if (dbColumn) {
          mainQuery += ` ORDER BY ${dbColumn} ${direction}, s.id DESC`
        } else {
          mainQuery += ' ORDER BY s.date DESC, s.id DESC'
        }
      } else {
        mainQuery += ' ORDER BY s.date DESC, s.id DESC'
      }
  
      mainQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      const mainQueryParams = [...params, limit, offset]
  
      const [mainResult, aggregationResult] = await Promise.all([
        db.query(mainQuery, mainQueryParams),
        db.query(aggregationQuery, params),
      ])
  
      const { rows } = mainResult
      const aggregationData = aggregationResult.rows[0]
  
      const totalCount = parseInt(aggregationData.total_count, 10) || 0
  
      return {
        sales: rows,
        totalCount,
        total_amount: aggregationData.total_amount,
        paid_amount: aggregationData.paid_amount,
      }
  }

async create(db, saleData, items) {
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      const {
        tenant_id, 
        party_id,
        done_by_id,
        cost_center_id,
        total_amount,
        paid_amount, // Use value from service
        status,      // Use value from service
        change_return = 0,
        discount,
        date,
        note,
        invoice_number,
        is_online,
      } = saleData

      const insertSaleQuery = `
        INSERT INTO sales(tenant_id, party_id, done_by_id, cost_center_id, total_amount, paid_amount, change_return, discount, date, status, note, invoice_number, ledger_id, is_online)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id;
      `
      const saleResult = await client.query(insertSaleQuery, [
        tenant_id,
        party_id,
        done_by_id,
        cost_center_id,
        total_amount,
        paid_amount, // Corrected
        change_return,
        discount,
        date,
        status,      // Corrected
        note,
        invoice_number,
        saleData.ledger_id,
        is_online,
      ])
      const newSaleId = saleResult.rows[0].id

      await this.salesItemRepository.createMany(
        client,
        newSaleId,
        items,
        tenant_id
      )
      
      await client.query('COMMIT')
      return this.getById(db, newSaleId, tenant_id)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

async update(db, id, tenantId, saleData, items) {
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      const {
        party_id,
        done_by_id,
        cost_center_id,
        total_amount,
        paid_amount, // NEW: Added
        status,      // NEW: Added
        change_return = 0,
        discount,
        date,
        note,
        invoice_number,
        is_online,
      } = saleData

      const updateSaleQuery = `
        UPDATE sales
        SET party_id = $1, total_amount = $2, discount = $3, 
            date = $4, done_by_id = $5, cost_center_id = $6, note = $7, 
            invoice_number = $8, change_return = $9, ledger_id = $10, 
            is_online = $11, paid_amount = $12, status = $13
        WHERE id = $14 AND tenant_id = $15;
      `
      await client.query(updateSaleQuery, [
        party_id,
        total_amount,
        discount,
        date,
        done_by_id,
        cost_center_id,
        note,
        invoice_number,
        change_return,
        saleData.ledger_id,
        is_online,
        paid_amount, // NEW: Index 12
        status,      // NEW: Index 13
        id,          // Index 14
        tenantId,    // Index 15
      ])

      await this.salesItemRepository.deleteBySalesId(client, id)
      await this.salesItemRepository.createMany(client, id, items, tenantId)
      
      await client.query('COMMIT')
      return this.getById(db, id, tenantId)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
  async delete(db, id, tenantId) {
    await db.query('DELETE FROM sales WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    return { id };
  }

  async getById(db, id, tenantId) {
    const query = `
      SELECT 
        s.*,
        p.name as party_name,
        p.ledger_id as party_ledger_id, -- <<< FETCH LEDGER ID FROM PARTY
        l.name as ledger_name,
        COALESCE(
          (
            SELECT json_group_array(
              json_object(
                'id', si.id,
                'item_id', si.item_id,
                'item_name', i.name,
                'quantity', si.quantity,
                'unit_price', si.unit_price,
                'tax_amount', si.tax_amount,
                'total_price', si.total_price
              )
            )
            FROM sale_item si
            JOIN item i ON si.item_id = i.id
            WHERE si.sales_id = s.id
          ),
          '[]'
        ) as items,
        COALESCE(
          (
            SELECT json_group_array(
              json_object(
                'voucher_id', pm.voucher_id,
                'account_id', pm.to_ledger_id,
                'account_name', pm.ledger_name,
                'amount', pm.received_amount,
                'mode_of_payment_id', pm.mode_of_payment_id,
                'voucher_no', pm.voucher_no,
                'payment_date', pm.v_date
              )
            )
            FROM (
              SELECT v.id as voucher_id, v.to_ledger_id, l4.name as ledger_name,
                     vt.received_amount, v.mode_of_payment_id, v.voucher_no, v.date as v_date
              FROM voucher_transactions vt
              JOIN voucher v ON vt.voucher_id = v.id
              JOIN ledger l4 ON v.to_ledger_id = l4.id
              WHERE CAST(vt.invoice_id AS INTEGER) = s.id
                AND vt.invoice_type = 'SALE'
                AND v.tenant_id = $2
                AND l4.name IS NOT NULL
            ) pm
          ),
          '[]'
        ) as payment_methods,
        (
          SELECT SUM(si.tax_amount) 
          FROM sale_item si 
          WHERE si.sales_id = s.id
        ) as tax_amount,
        (
          SELECT SUM(si.quantity * si.unit_price) 
          FROM sale_item si 
          WHERE si.sales_id = s.id
        ) as sub_total,
        json_object(
           'company_name', ps.company_name,
           'email', ps.email,
           'phone', ps.phone,
           'address', ps.address,
           'store', ps.store,
           'full_header_image_url', ps.header_image_url,
           'header_image_url', ps.header_image_url,
           'image_height', ps.image_height,
           'image_width', ps.image_width,
           'tr_number', ps.tr_number,
           'footer_message', ps.footer_message
        ) as store
      FROM sales s
      LEFT JOIN party p ON s.party_id = p.id
      LEFT JOIN ledger l ON s.ledger_id = l.id
      LEFT JOIN print_settings ps ON s.tenant_id = ps.tenant_id
      WHERE s.id = $1 AND s.tenant_id = $2;  
    `
    const { rows } = await db.query(query, [id, tenantId])
    return rows[0]
  }

  async increaseItemReturnedQuantity(
    dbClient,
    saleId,
    itemId,
    quantityToReturn
  ) {
    const query = `
      UPDATE sale_item
      SET returned_quantity = returned_quantity + $1
      WHERE sales_id = $2
        AND item_id = $3
        AND (quantity - returned_quantity) >= $1; 
    `
    const { rowCount } = await dbClient.query(query, [
      quantityToReturn,
      saleId,
      itemId,
    ])

    if (rowCount === 0) {
      throw new Error(
        'Failed to update returned quantity. Either the item is not part of the sale or the return quantity exceeds the amount available to be returned.'
      )
    }

    return rowCount
  }

  async decreaseItemReturnedQuantity(
    dbClient,
    saleId,
    itemId,
    quantityToRestore
  ) {
    const query = `
      UPDATE sale_item
      SET returned_quantity = returned_quantity - $1
      WHERE sales_id = $2 AND item_id = $3;
    `

    const { rowCount } = await dbClient.query(query, [
      quantityToRestore,
      saleId,
      itemId,
    ])

    if (rowCount === 0) {
      console.warn(
        `Could not decrease returned quantity for sales_id ${saleId} and item_id ${itemId}. The sale_item may have been removed.`
      )
    }

    return rowCount
  }
   async updatePaymentAndStatus(client, id, amountChange) {
    await client.query(`UPDATE sales SET paid_amount = COALESCE(paid_amount, 0) + $1 WHERE id = $2`, [amountChange, id]);
    
    // Update status based on new paid_amount
    await client.query(`
      UPDATE sales
      SET status = CASE
              WHEN paid_amount >= total_amount - 0.01 THEN 'paid'
              WHEN paid_amount > 0 THEN 'partial'
              ELSE 'unpaid'
          END
      WHERE id = $1
    `, [id]);

    // Return the updated sale record (without RETURNING for SQLite compatibility)
    const { rows } = await client.query(`SELECT id, status, paid_amount, total_amount FROM sales WHERE id = $1`, [id]);
    
    if (rows.length === 0) {
      throw new Error(`Sale with ID ${id} not found for payment update.`);
    }
    return rows[0];
  }

  async reconcilePaidAmount(db, id) {
    const query = `
      UPDATE sales
      SET paid_amount = (
        SELECT COALESCE(SUM(received_amount), 0)
        FROM voucher_transactions
        WHERE CAST(invoice_id AS INTEGER) = $1 AND invoice_type = 'SALE'
      ),
      status = CASE
        WHEN (SELECT COALESCE(SUM(received_amount), 0) FROM voucher_transactions WHERE CAST(invoice_id AS INTEGER) = $1 AND invoice_type = 'SALE') >= total_amount - 0.01 THEN 'paid'
        WHEN (SELECT COALESCE(SUM(received_amount), 0) FROM voucher_transactions WHERE CAST(invoice_id AS INTEGER) = $1 AND invoice_type = 'SALE') > 0 THEN 'partial'
        ELSE 'unpaid'
      END
      WHERE id = $1;
    `;
    return await db.query(query, [id]);
  }
}

module.exports = SalesRepository