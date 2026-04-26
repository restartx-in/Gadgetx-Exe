class SaleReturnRepository {
  constructor() {}

  async create(dbClient, returnData) {
    const {
      tenant_id,
      sale_id,
      item_id,
      return_quantity,
      date,
      reason,
      total_refund_amount,
      done_by_id,
      cost_center_id,
      invoice_number,
    } = returnData;

    const insertReturnQuery = `
      INSERT INTO sale_return(
        tenant_id, sale_id, item_id, return_quantity, date, 
        reason, total_refund_amount, refunded_amount, status, 
        done_by_id, cost_center_id, invoice_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'pending', $8, $9, $10)
      RETURNING *`;

    const { rows } = await dbClient.query(insertReturnQuery, [
      tenant_id,
      sale_id,
      item_id,
      return_quantity,
      date || new Date().toISOString(),
      reason,
      total_refund_amount,
      done_by_id,
      cost_center_id,
      invoice_number,
    ]);
    return rows[0];
  }

  async update(dbClient, id, tenantId, returnData) {
    const {
      return_quantity,
      date,
      reason,
      total_refund_amount,
      done_by_id,
      cost_center_id,
      invoice_number,
    } = returnData;

    const updateReturnQuery = `
      UPDATE sale_return
      SET return_quantity = $1, date = $2, reason = $3, total_refund_amount = $4, 
          done_by_id = $5, cost_center_id = $6, invoice_number = $7
      WHERE id = $8 AND tenant_id = $9
      RETURNING *`;

    const { rows } = await dbClient.query(updateReturnQuery, [
      return_quantity,
      date,
      reason,
      total_refund_amount,
      done_by_id,
      cost_center_id,
      invoice_number,
      id,
      tenantId,
    ]);
    return rows[0];
  }

  async getById(db, id, tenantId) {
    const query = `
      SELECT 
          sr.*,
          s.party_id,
          p.ledger_id as party_ledger_id,
          p.name as party_name,
          i.name as item_name,
          (sr.total_refund_amount - sr.refunded_amount) as balance,
          (
            SELECT json_group_array(
              json_object(
                'account_id', v.from_ledger_id,
                'account_name', l.name,
                'amount', vt.received_amount,
                'mode_of_payment_id', v.mode_of_payment_id,
                'voucher_no', v.voucher_no,
                'payment_date', v.date
              )
            )
            FROM voucher_transactions vt
            JOIN voucher v ON vt.voucher_id = v.id
            JOIN ledger l ON v.from_ledger_id = l.id
            WHERE CAST(vt.invoice_id AS INTEGER) = sr.id 
              AND vt.invoice_type = 'SALERETURN'
              AND v.tenant_id = $2
          ) as payment_methods
      FROM sale_return sr
      LEFT JOIN sales s ON sr.sale_id = s.id
      LEFT JOIN party p ON s.party_id = p.id
      LEFT JOIN item i ON sr.item_id = i.id
      WHERE sr.id = $1 AND sr.tenant_id = $2
    `;
    const { rows } = await db.query(query, [id, tenantId]);
    return rows[0];
  }

  async delete(dbClient, id, tenantId) {
    const { rows } = await dbClient.query(
      "DELETE FROM sale_return WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [id, tenantId]
    );
    return rows[0];
  }

  async getPaginatedByUserId(db, tenantId, filters = {}) {
    const {
      page = 1,
      page_size = 10,
      sort,
      searchType,
      searchKey,
      start_date,
      end_date,
      item_id,
      party_id,
      done_by_id,
      cost_center_id,
      invoice_number,
      payment_due_only,
    } = filters;
    const limit = parseInt(page_size, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    let query = `
        SELECT
          sr.id,
          sr.sale_id,
          sr.item_id,
          sr.return_quantity,
          sr.total_refund_amount,
          sr.refunded_amount,
          (sr.total_refund_amount - sr.refunded_amount) as balance,
          sr.status,
          sr.date,
          sr.invoice_number,
          i.name as item_name,
          pa.name as party_name,
          db.name as done_by_name,
          cc.name as cost_center_name
        FROM sale_return sr
        LEFT JOIN item i ON sr.item_id = i.id
        LEFT JOIN sales s ON sr.sale_id = s.id
        LEFT JOIN party pa ON s.party_id = pa.id 
        LEFT JOIN "done_by" db ON sr.done_by_id = db.id
        LEFT JOIN "cost_center" cc ON sr.cost_center_id = cc.id
        WHERE sr.tenant_id = $1
    `;

    const params = [tenantId];
    let paramIndex = 2;

    if (searchKey && searchType) {
      const searchConfig = {
        item_name: "i.name",
        party_name: "pa.name",
        invoice_number: "sr.invoice_number",
      };
      if (searchConfig[searchType]) {
        query += ` AND ${searchConfig[searchType]} LIKE $${paramIndex++}`;
        params.push(`%${searchKey}%`);
      }
    }

    if (start_date) {
      query += ` AND sr.date >= $${paramIndex++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND sr.date <= $${paramIndex++}`;
      params.push(end_date);
    }
    if (item_id) {
      query += ` AND sr.item_id = $${paramIndex++}`;
      params.push(item_id);
    }
    if (party_id) {
      query += ` AND s.party_id = $${paramIndex++}`;
      params.push(party_id);
    }
    if (payment_due_only) {
      query += ` AND sr.total_refund_amount > sr.refunded_amount`;
    }

    query += " ORDER BY sr.date DESC, sr.id DESC";
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    return { saleReturns: rows, totalCount: rows.length > 0 ? 1000 : 0 };
  }

  async getAllByUserId(db, tenantId, filters) {
    const { party_id, payment_due_only, ids } = filters || {};
    let query = `
            SELECT sr.*, s.party_id, (sr.total_refund_amount - sr.refunded_amount) as balance
            FROM sale_return sr
            LEFT JOIN sales s ON sr.sale_id = s.id
            WHERE sr.tenant_id = $1
        `;
    const params = [tenantId];
    let paramIndex = 2;
    if (party_id) {
      query += ` AND s.party_id = $${paramIndex++}`;
      params.push(party_id);
    }
    if (payment_due_only) {
      query += ` AND sr.total_refund_amount > sr.refunded_amount`;
    }
    if (ids) {
      const idArray = Array.isArray(ids)
        ? ids
        : ids.split(",").map((id) => parseInt(id.trim()));
      const placeholders = idArray.map(() => `$${paramIndex++}`).join(", ");
      query += ` AND sr.id IN (${placeholders})`;
      params.push(...idArray);
    }
    query += ` ORDER BY sr.date DESC`;
    const { rows } = await db.query(query, params);
    return rows;
  }

  async updatePaymentAndStatus(client, id, amountChange) {
    const query = `
    UPDATE sale_return
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
    if (rows.length === 0) throw new Error(`Sale Return with ID ${id} not found.`);
    return rows[0];
  }
}

module.exports = SaleReturnRepository;
