class PurchaseReturnRepository {
  constructor() {}

  async create(db, returnData) {
    const {
      tenant_id,
      purchase_id,
      item_id,
      return_quantity,
      date,
      reason,
      total_refund_amount,
      done_by_id,
      cost_center_id,
      invoice_number,
    } = returnData;

    const { rows } = await db.query(
      `INSERT INTO purchase_return (
        tenant_id, purchase_id, item_id, return_quantity, date, 
        reason, total_refund_amount, refunded_amount, status, 
        done_by_id, cost_center_id, invoice_number
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'pending', $8, $9, $10)
       RETURNING *`,
      [
        tenant_id,
        purchase_id,
        item_id,
        return_quantity,
        date || new Date().toISOString(),
        reason,
        total_refund_amount,
        done_by_id,
        cost_center_id,
        invoice_number,
      ]
    );
    return rows[0];
  }

  async update(db, id, tenantId, returnData) {
    const {
      return_quantity,
      date,
      reason,
      total_refund_amount,
      done_by_id,
      cost_center_id,
      invoice_number,
    } = returnData;

    const { rows } = await db.query(
      `UPDATE purchase_return
       SET return_quantity = $1, date = $2, reason = $3, total_refund_amount = $4, 
           done_by_id = $5, cost_center_id = $6, invoice_number = $7
       WHERE id = $8 AND tenant_id = $9
       RETURNING *`,
      [
        return_quantity,
        date,
        reason,
        total_refund_amount,
        done_by_id,
        cost_center_id,
        invoice_number,
        id,
        tenantId,
      ]
    );
    return rows[0];
  }

  async getById(db, id, tenantId) {
    const query = `
      SELECT
        pr.*, 
        i.name as item_name, 
        i.sku as item_sku, 
        pa.name as party_name,
        pa.ledger_id as party_ledger_id,
        db.name as done_by_name, 
        cc.name as cost_center_name,
        (pr.total_refund_amount - pr.refunded_amount) as balance,
        (
          SELECT json_group_array(
            json_object(
              'account_id', v.to_ledger_id,
              'account_name', l.name,
              'amount', vt.received_amount,
              'mode_of_payment_id', v.mode_of_payment_id,
              'voucher_no', v.voucher_no,
              'payment_date', v.date
            )
          )
          FROM voucher_transactions vt
          JOIN voucher v ON vt.voucher_id = v.id
          JOIN ledger l ON v.to_ledger_id = l.id
          WHERE CAST(vt.invoice_id AS INTEGER) = pr.id 
            AND vt.invoice_type = 'PURCHASERETURN'
            AND v.tenant_id = $2
        ) as payment_methods
      FROM purchase_return pr
      LEFT JOIN item i ON pr.item_id = i.id
      LEFT JOIN purchase p ON pr.purchase_id = p.id
      LEFT JOIN party pa ON p.party_id = pa.id
      LEFT JOIN "done_by" db ON pr.done_by_id = db.id
      LEFT JOIN "cost_center" cc ON pr.cost_center_id = cc.id
      WHERE pr.id = $1 AND pr.tenant_id = $2;
    `;
    const { rows } = await db.query(query, [id, tenantId]);
    return rows[0];
  }

  async delete(db, id, tenantId) {
    const { rows } = await db.query(
      "DELETE FROM purchase_return WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [id, tenantId]
    );
    return rows[0];
  }

  async getAllByUserId(db, tenantId, filters = {}) {
    const { party_id, payment_due_only, ids } = filters;
    let query = `
      SELECT
        pr.*,
        i.name as item_name,
        pa.name as party_name,
        (pr.total_refund_amount - pr.refunded_amount) as balance
      FROM purchase_return pr
      LEFT JOIN item i ON pr.item_id = i.id
      LEFT JOIN purchase p ON pr.purchase_id = p.id
      LEFT JOIN party pa ON p.party_id = pa.id
      WHERE pr.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (party_id) { query += ` AND p.party_id = $${paramIndex++}`; params.push(party_id); }
    if (payment_due_only) { query += ` AND pr.total_refund_amount > pr.refunded_amount`; }
    if (ids) {
        const idArray = Array.isArray(ids) ? ids : ids.split(',').map(id => parseInt(id.trim()));
        const placeholders = idArray.map(() => `$${paramIndex++}`).join(", ");
        query += ` AND pr.id IN (${placeholders})`;
        params.push(...idArray);
    }

    query += " ORDER BY pr.date DESC, pr.id DESC";
    const { rows } = await db.query(query, params);
    return rows;
  }

  async getPaginatedUserId(db, tenantId, filters = {}) {
    const {
      page = 1, page_size = 10, searchType, searchKey, start_date, end_date, payment_due_only
    } = filters;
    const limit = parseInt(page_size, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    let query = `
      SELECT
        pr.*, i.name as item_name, pa.name as party_name,
        db.name as done_by_name, cc.name as cost_center_name,
        (pr.total_refund_amount - pr.refunded_amount) as balance
      FROM purchase_return pr
      LEFT JOIN item i ON pr.item_id = i.id
      LEFT JOIN purchase p ON pr.purchase_id = p.id
      LEFT JOIN party pa ON p.party_id = pa.id
      LEFT JOIN "done_by" db ON pr.done_by_id = db.id
      LEFT JOIN "cost_center" cc ON pr.cost_center_id = cc.id
      WHERE pr.tenant_id = $1
    `;
    const params = [tenantId];
    let paramIndex = 2;

    if (searchKey && searchType) {
        if (searchType === "item_name") { query += ` AND i.name LIKE $${paramIndex++}`; params.push(`%${searchKey}%`); }
        else if (searchType === "party_name") { query += ` AND pa.name LIKE $${paramIndex++}`; params.push(`%${searchKey}%`); }
    }
    if (start_date) { query += ` AND pr.date >= $${paramIndex++}`; params.push(start_date); }
    if (end_date) { query += ` AND pr.date <= $${paramIndex++}`; params.push(end_date); }
    if (payment_due_only) { query += ` AND pr.total_refund_amount > pr.refunded_amount`; }

    query += " ORDER BY pr.date DESC, pr.id DESC";
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return { purchaseReturns: rows, totalCount: rows.length > 0 ? 1000 : 0 };
  }

  async updatePaymentAndStatus(client, id, amountChange) {
    const query = `
    UPDATE purchase_return
    SET
        refunded_amount = refunded_amount + $1,
        status = CASE
            WHEN (refunded_amount + $1) >= total_refund_amount THEN 'refunded'
            WHEN (refunded_amount + $1) > 0 THEN 'partial'
            ELSE 'pending'
        END
    WHERE id = $2
    RETURNING id, status;
  `;
    const { rows } = await client.query(query, [amountChange, id]);
    if (rows.length === 0) throw new Error(`Purchase Return ID ${id} not found.`);
    return rows[0];
  }
}

module.exports = PurchaseReturnRepository;