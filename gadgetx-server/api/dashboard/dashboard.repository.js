class DashboardRepository {
  async getFinancialSummary(db, tenantId, period = "month") {
    let dateFilter = "INTERVAL '1 month'";
    if (period === "today") dateFilter = "INTERVAL '1 day'";
    if (period === "week") dateFilter = "INTERVAL '1 week'";
    if (period === "year") dateFilter = "INTERVAL '1 year'";

    const salesQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total,
        COALESCE(SUM(paid_amount), 0) as paid
      FROM sales 
      WHERE tenant_id = $1 AND "date" >= NOW() - ${dateFilter}
    `;

    const purchaseQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total,
        COALESCE(SUM(paid_amount), 0) as paid
      FROM purchase 
      WHERE tenant_id = $1 AND "date" >= NOW() - ${dateFilter}
    `;

    const expenseQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total,
        COALESCE(SUM(amount_paid), 0) as paid
      FROM expenses 
      WHERE tenant_id = $1 AND "date" >= NOW() - ${dateFilter}
    `;

    const [sales, purchase, expense] = await Promise.all([
      db.query(salesQuery, [tenantId]),
      db.query(purchaseQuery, [tenantId]),
      db.query(expenseQuery, [tenantId]),
    ]);

    return {
      sales: sales.rows[0],
      purchase: purchase.rows[0],
      expense: expense.rows[0],
      netProfit: (parseFloat(sales.rows[0].total) - parseFloat(purchase.rows[0].total) - parseFloat(expense.rows[0].total)).toFixed(2)
    };
  }

  async getWeeklySalesPurchases(db, tenantId, period = "month") {
    let query = "";
    if (period === "today") {
      query = `
        WITH hours AS (
          SELECT generate_series(
            date_trunc('day', NOW()) + INTERVAL '6 hours',
            date_trunc('day', NOW()) + INTERVAL '22 hours',
            '2 hour'::interval
          ) as hr
        )
        SELECT 
          TO_CHAR(h.hr, 'HH24:MI') as day,
          (SELECT COALESCE(SUM(total_amount), 0)::DOUBLE PRECISION FROM sales WHERE tenant_id = $1 AND "date" >= h.hr AND "date" < h.hr + INTERVAL '2 hour') as "Sales",
          (SELECT COALESCE(SUM(total_amount), 0)::DOUBLE PRECISION FROM purchase WHERE tenant_id = $1 AND "date" >= h.hr AND "date" < h.hr + INTERVAL '2 hour') as "Purchases"
        FROM hours h
        ORDER BY h.hr;
      `;
    } else if (period === "year") {
      query = `
        WITH months AS (
          SELECT generate_series(
            date_trunc('year', NOW()),
            date_trunc('year', NOW()) + INTERVAL '11 months',
            '1 month'::interval
          ) as mo
        )
        SELECT 
          TO_CHAR(m.mo, 'Mon') as day,
          (SELECT COALESCE(SUM(total_amount), 0)::DOUBLE PRECISION FROM sales WHERE tenant_id = $1 AND "date" >= m.mo AND "date" < m.mo + INTERVAL '1 month') as "Sales",
          (SELECT COALESCE(SUM(total_amount), 0)::DOUBLE PRECISION FROM purchase WHERE tenant_id = $1 AND "date" >= m.mo AND "date" < m.mo + INTERVAL '1 month') as "Purchases"
        FROM months m
        ORDER BY m.mo;
      `;
    } else {
      // Week or Month
      let interval = period === "week" ? "6 days" : "29 days";
      query = `
        WITH days AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '${interval}',
            CURRENT_DATE,
            '1 day'::interval
          )::date as day
        )
        SELECT 
          TO_CHAR(d.day, 'DD Mon') as day,
          (SELECT COALESCE(SUM(total_amount), 0)::DOUBLE PRECISION FROM sales WHERE tenant_id = $1 AND "date"::date = d.day) as "Sales",
          (SELECT COALESCE(SUM(total_amount), 0)::DOUBLE PRECISION FROM purchase WHERE tenant_id = $1 AND "date"::date = d.day) as "Purchases"
        FROM days d
        ORDER BY d.day;
      `;
    }
    const { rows } = await db.query(query, [tenantId]);
    return rows;
  }

  async getTopSellingProducts(db, tenantId, period = "month") {
    const query = `
      SELECT 
        i.name,
        SUM(si.quantity) as quantity,
        SUM(si.total_price) as value
      FROM sale_item si
      JOIN item i ON si.item_id = i.id
      JOIN sales s ON si.sales_id = s.id
      WHERE s.tenant_id = $1 AND s."date" >= NOW() - INTERVAL '${period === 'today' ? '1 day' : (period === 'week' ? '7 days' : (period === 'year' ? '1 year' : '1 month'))}'
      GROUP BY i.id, i.name
      ORDER BY quantity DESC
      LIMIT 5;
    `;
    const { rows } = await db.query(query, [tenantId]);
    return rows;
  }

  async getStockAlerts(db, tenantId) {
    const query = `
      SELECT 
        name as product,
        stock_quantity as quantity,
        min_stock_level,
        sku as code
      FROM item
      WHERE tenant_id = $1 AND stock_quantity <= min_stock_level
      ORDER BY stock_quantity ASC
      LIMIT 10;
    `;
    const { rows } = await db.query(query, [tenantId]);
    return rows;
  }

  async getRecentSales(db, tenantId) {
    const query = `
      SELECT 
        s.id,
        p.name as party,
        s.invoice_number as reference,
        s."date",
        s.total_amount as "grandTotal",
        s.status as "paymentStatus"
      FROM sales s
      JOIN party p ON s.party_id = p.id
      WHERE s.tenant_id = $1
      ORDER BY s."date" DESC
      LIMIT 5;
    `;
    const { rows } = await db.query(query, [tenantId]);
    return rows;
  }

  async getRecentPurchases(db, tenantId) {
    const query = `
      SELECT 
        p.id,
        pt.name as party,
        p.invoice_number as reference,
        p."date",
        p.total_amount as "grandTotal",
        p.status as "paymentStatus"
      FROM purchase p
      JOIN party pt ON p.party_id = pt.id
      WHERE p.tenant_id = $1
      ORDER BY p."date" DESC
      LIMIT 5;
    `;
    const { rows } = await db.query(query, [tenantId]);
    return rows;
  }

  async getRecentExpenses(db, tenantId) {
    const query = `
      SELECT 
        e.id,
        e.description,
        et.name as category,
        e.amount,
        e."date"
      FROM expenses e
      JOIN expense_type et ON e.expense_type_id = et.id
      WHERE e.tenant_id = $1
      ORDER BY e."date" DESC
      LIMIT 5;
    `;
    const { rows } = await db.query(query, [tenantId]);
    return rows;
  }
}

module.exports = DashboardRepository;
