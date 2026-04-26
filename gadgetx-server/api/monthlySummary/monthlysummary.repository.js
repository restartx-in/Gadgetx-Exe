class MonthlySummaryRepository {
  // No constructor — db is passed per-method (consistent with other repos)

  _buildDateFilters(query, params, dateColumn, filters) {
    const effectiveFilters = { ...filters };
    if (!effectiveFilters.start_date && !effectiveFilters.end_date) {
      const currentYear = new Date().getFullYear();
      effectiveFilters.start_date = `${currentYear}-01-01`;
      effectiveFilters.end_date = `${currentYear}-12-31`;
    }
    let paramIndex = params.length + 1;
    if (effectiveFilters.start_date) {
      query += ` AND ${dateColumn} >= $${paramIndex++}`;
      params.push(effectiveFilters.start_date);
    }
    if (effectiveFilters.end_date) {
      query += ` AND ${dateColumn} <= $${paramIndex++}`;
      params.push(effectiveFilters.end_date);
    }
    return { query, params };
  }

  // SQLite: strftime('%Y', date) for year, strftime('%m', date) for month number
  async getExpenses(db, tenantId, filters) {
    let { query, params } = this._buildDateFilters(
      `SELECT
          CAST(strftime('%Y', date) AS INTEGER) AS year,
          strftime('%m', date) AS month_num,
          COUNT(*) AS expense_count,
          COALESCE(SUM(amount), 0) AS total_amount,
          COALESCE(SUM(amount_paid), 0) AS total_paid,
          COALESCE(SUM(amount - amount_paid), 0) AS total_balance
        FROM expenses WHERE tenant_id = $1`,
      [tenantId],
      "date",
      filters
    );
    query += ` GROUP BY strftime('%Y-%m', date) ORDER BY strftime('%Y-%m', date) DESC`;
    const { rows } = await db.query(query, params);
    return rows.map(r => ({ ...r, month: _monthNumToName(r.month_num) }));
  }

  async getSales(db, tenantId, filters) {
    let { query, params } = this._buildDateFilters(
      `SELECT
          CAST(strftime('%Y', s.date) AS INTEGER) AS year,
          strftime('%m', s.date) AS month_num,
          COUNT(*) AS sale_count,
          COALESCE(SUM(s.paid_amount), 0) AS total_received,
          COALESCE(SUM(s.total_amount - s.paid_amount), 0) AS total_pending
        FROM sales s
        WHERE s.tenant_id = $1`,
      [tenantId],
      "s.date",
      filters
    );
    query += ` GROUP BY strftime('%Y-%m', s.date) ORDER BY strftime('%Y-%m', s.date) DESC`;
    const { rows } = await db.query(query, params);
    return rows.map(r => ({ ...r, month: _monthNumToName(r.month_num) }));
  }

  async getPurchases(db, tenantId, filters) {
    let { query, params } = this._buildDateFilters(
      `SELECT
          CAST(strftime('%Y', p.date) AS INTEGER) AS year,
          strftime('%m', p.date) AS month_num,
          COUNT(*) AS purchase_count,
          COALESCE(SUM(p.paid_amount), 0) AS total_paid,
          COALESCE(SUM(p.total_amount - p.paid_amount), 0) AS total_pending
        FROM purchase p
        WHERE p.tenant_id = $1`,
      [tenantId],
      "p.date",
      filters
    );
    query += ` GROUP BY strftime('%Y-%m', p.date) ORDER BY strftime('%Y-%m', p.date) DESC`;
    const { rows } = await db.query(query, params);
    return rows.map(r => ({ ...r, month: _monthNumToName(r.month_num) }));
  }
}

// Helper: '01' -> 'January', '02' -> 'February', etc.
function _monthNumToName(num) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[parseInt(num, 10) - 1] || num;
}

module.exports = MonthlySummaryRepository;