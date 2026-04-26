class VoucherRepository {
  async create(client, voucherData) {
    const {
      tenant_id,
      amount,
      date,
      description,
      voucher_no,
      voucher_type,
      from_ledger,
      to_ledger,
      cost_center_id,
      done_by_id,
      mode_of_payment_id,
    } = voucherData;

    const query = `
      INSERT INTO voucher(tenant_id, amount, date, description, voucher_no, voucher_type, from_ledger_id, to_ledger_id, cost_center_id, done_by_id, mode_of_payment_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const result = await client.query(query, [
      tenant_id,
      amount,
      date,
      description,
      voucher_no,
      voucher_type,
      from_ledger.ledger_id,
      to_ledger.ledger_id,
      cost_center_id,
      done_by_id,
      mode_of_payment_id,
    ]);
    return result.rows[0];
  }

  async update(client, id, tenantId, voucherData) {
    const {
      amount,
      date,
      description,
      voucher_no,
      voucher_type,
      from_ledger,
      to_ledger,
      cost_center_id,
      done_by_id,
      mode_of_payment_id,
    } = voucherData;

    const query = `
      UPDATE voucher SET
        amount = $1, date = $2, description = $3, voucher_no = $4, voucher_type = $5,
        from_ledger_id = $6, to_ledger_id = $7, cost_center_id = $8, done_by_id = $9, mode_of_payment_id = $10
      WHERE id = $11 AND tenant_id = $12
      RETURNING *;
    `;
    const result = await client.query(query, [
      amount,
      date,
      description,
      voucher_no,
      voucher_type,
      from_ledger.ledger_id,
      to_ledger.ledger_id,
      cost_center_id,
      done_by_id,
      mode_of_payment_id,
      id,
      tenantId,
    ]);
    return result.rows[0];
  }

  async delete(client, id, tenantId) {
    const { rows } = await client.query(
      "DELETE FROM voucher WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [id, tenantId]
    );
    return rows[0];
  }

  async getById(db, id, tenantId) {
    const { rows } = await db.query(
      `SELECT v.*,
              fl.name as from_ledger_name,
              tl.name as to_ledger_name,
              cc.name as cost_center_name,
              db.name as done_by_name,
              (SELECT json_group_array(
                 json_object(
                    'id', vt.id, 
                    'invoice_id', vt.invoice_id, 
                    'invoice_type', vt.invoice_type, 
                    'received_amount', vt.received_amount
                 )
               )
               FROM voucher_transactions vt
               WHERE vt.voucher_id = v.id
              ) as transactions,
              json_object('ledger_id', v.from_ledger_id, 'amount', v.amount, 'ledger_name', fl.name) as from_ledger,
              json_object('ledger_id', v.to_ledger_id, 'amount', v.amount, 'ledger_name', tl.name) as to_ledger
       FROM voucher v
       LEFT JOIN ledger fl ON v.from_ledger_id = fl.id
       LEFT JOIN ledger tl ON v.to_ledger_id = tl.id
       LEFT JOIN "cost_center" cc ON v.cost_center_id = cc.id
       LEFT JOIN "done_by" db ON v.done_by_id = db.id
       WHERE v.id = $1 AND v.tenant_id = $2`,
      [id, tenantId]
    );
    return rows[0];
  }

  async getAll(db, tenantId, filters = {}) {
    const { rows } = await db.query(
      `SELECT v.*, fl.name as from_ledger_name, tl.name as to_ledger_name 
       FROM voucher v 
       LEFT JOIN ledger fl ON v.from_ledger_id = fl.id 
       LEFT JOIN ledger tl ON v.to_ledger_id = tl.id 
       WHERE v.tenant_id = $1 ORDER BY v.date DESC`,
      [tenantId]
    );
    return rows;
  }

  async getPaginated(db, tenantId, filters = {}) {
    const { page = 1, page_size = 10, sort, ...otherFilters } = filters;
    const limit = parseInt(page_size, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const fromAndJoins = `
      FROM voucher v
      LEFT JOIN ledger fl ON v.from_ledger_id = fl.id
      LEFT JOIN ledger tl ON v.to_ledger_id = tl.id
      LEFT JOIN "cost_center" cc ON v.cost_center_id = cc.id
      LEFT JOIN "done_by" db ON v.done_by_id = db.id
    `;
    
    let whereClause = ` WHERE v.tenant_id = $1 `;
    const params = [tenantId];
    let paramIndex = 2;

    const filterConfig = {
      from_ledger_id: { operator: "=", column: "v.from_ledger_id" },
      to_ledger_id: { operator: "=", column: "v.to_ledger_id" },
      cost_center_id: { operator: "=", column: "v.cost_center_id" },
      done_by_id: { operator: "=", column: "v.done_by_id" },
      voucher_type: { operator: "=", column: "v.voucher_type" },
      amount: { operator: "=", column: "v.amount" }, 
      min_amount: { operator: ">=", column: "v.amount" },
      max_amount: { operator: "<=", column: "v.amount" },
      start_date: { operator: ">=", column: "v.date" },
      end_date: { operator: "<=", column: "v.date" },
      voucher_no: { operator: "LIKE", column: "v.voucher_no", isString: true },
    };

    Object.keys(otherFilters).forEach((key) => {
      const value = otherFilters[key];
      if (value !== null && value !== undefined && value !== "") {
        if (key === 'invoice_types') {
          const types = Array.isArray(value) ? value : value.split(',').map(t => t.trim());
          if (types.length > 0) {
              const placeholders = types.map(() => `$${paramIndex++}`).join(", ");
              whereClause += ` AND EXISTS (
                SELECT 1 FROM voucher_transactions vt 
                WHERE vt.voucher_id = v.id AND vt.invoice_type IN (${placeholders})
              )`;
              params.push(...types);
          }
        } else if (filterConfig[key]) {
          const { operator, column, isString } = filterConfig[key];
          let finalValue = value;
          if (isString) finalValue = `%${value}%`;
          
          whereClause += ` AND ${column} ${operator} $${paramIndex++}`;
          params.push(finalValue);
        }
      }
    });

    const aggregationQuery = `
      SELECT COALESCE(SUM(v.amount), 0) as total_amount
      ${fromAndJoins}
      ${whereClause}
    `;

    let mainQuery = `
      SELECT 
          v.*, 
          fl.name as from_ledger_name,
          tl.name as to_ledger_name,
          cc.name as cost_center_name,
          db.name as done_by_name,
          (SELECT invoice_type FROM voucher_transactions WHERE voucher_id = v.id LIMIT 1) as invoice_type
      ${fromAndJoins}
      ${whereClause}
    `;

    mainQuery += " ORDER BY v.date DESC, v.id DESC";
    mainQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const mainQueryParams = [...params, limit, offset];

    const [mainResult, aggregationResult] = await Promise.all([
      db.query(mainQuery, mainQueryParams),
      db.query(aggregationQuery, params),
    ]);

    const { rows } = mainResult;
    const aggregationData = aggregationResult.rows[0];

    return {
      vouchers: rows,
      totalCount: rows.length > 0 ? 1000 : 0, // Placeholder
      total_amount: aggregationData.total_amount,
    };
  }
}

module.exports = VoucherRepository;