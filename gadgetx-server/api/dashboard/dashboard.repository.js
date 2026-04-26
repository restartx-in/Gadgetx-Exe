class DashboardRepository {
  async getFinancialSummary(db, tenantId) {
    const today = new Date().toISOString().split('T')[0]

    const queries = {
      service: `
        SELECT
          COALESCE(SUM(service_cost), 0) as total_cost,
          COALESCE(SUM(service_charges), 0) as total_service_charges,
          COALESCE(
            SUM(CASE WHEN service_charges > 0 THEN service_charges - service_cost ELSE 0 END), 
           0) AS total_profit,
          
          COUNT(job_id) AS total_count,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_count,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS progress_count,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
          SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) AS delivered_count
        FROM job_sheets WHERE tenant_id = $1
      `,
      expense: `
        SELECT
          COALESCE(SUM(amount), 0) as total,
          COALESCE(SUM(amount_paid), 0) as paid,
          COALESCE(SUM(amount - amount_paid), 0) as balance
        FROM expenses WHERE tenant_id = $1
      `,
      sales: `
        SELECT
          COALESCE(SUM(total_amount), 0) as total,
          COALESCE(SUM(paid_amount), 0) as paid,
          COALESCE(SUM(total_amount - paid_amount), 0) as pending
        FROM sales WHERE tenant_id = $1
      `,
      purchases: `
        SELECT
          COALESCE(SUM(total_amount), 0) as total,
          COALESCE(SUM(paid_amount), 0) as paid,
          COALESCE(SUM(total_amount - paid_amount), 0) as pending
        FROM purchase WHERE tenant_id = $1
      `,
      salesReturns: `SELECT 0 as total, 0 as paid, 0 as pending`,
      purchaseReturns: `
        SELECT
          COALESCE(SUM(total_refund_amount), 0) as total,
          COALESCE(SUM(total_refund_amount), 0) as paid,
          0 as pending
        FROM purchase_return WHERE tenant_id = $1
      `,
      today: `
        SELECT
          (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE tenant_id = $1 AND date(date) = $2) as "salesTotal",
          (SELECT COALESCE(SUM(paid_amount), 0) FROM sales WHERE tenant_id = $1 AND date(date) = $2) as "salesPaid",
          (SELECT COALESCE(SUM(total_amount), 0) FROM purchase WHERE tenant_id = $1 AND date(date) = $2) as "purchasesTotal",
          (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE tenant_id = $1 AND date(date) = $2) as "expensesTotal",
          (SELECT COALESCE(SUM(service_cost), 0) FROM job_sheets WHERE tenant_id = $1 AND date(date) = $2) as "serviceCost",
          (SELECT COALESCE(SUM(service_charges), 0) FROM job_sheets WHERE tenant_id = $1 AND date(date) = $2) as "servicecharge",
          (SELECT 
            COALESCE(
             SUM(
                CASE 
                    WHEN service_charges != 0 THEN service_charges - service_cost
                    ELSE 0 
                END
             ), 
            0
           ) 
            FROM job_sheets 
            WHERE tenant_id = $1 AND date(date) = $2
          ) as "serviceProfit"
      `,
    }

    const [
      expense,
      service,
      sales,
      purchases,
      salesReturns,
      purchaseReturns,
      todaySummary,
    ] = await Promise.all([
      db.query(queries.expense, [tenantId]),
      db.query(queries.service, [tenantId]),
      db.query(queries.sales, [tenantId]),
      db.query(queries.purchases, [tenantId]),
      db.query(queries.salesReturns),
      db.query(queries.purchaseReturns, [tenantId]),
      db.query(queries.today, [tenantId, today]),
    ])

    return {
      expense: expense.rows[0],
      service: service.rows[0],
      sales: sales.rows[0],
      purchases: purchases.rows[0],
      salesReturns: salesReturns.rows[0],
      purchaseReturns: purchaseReturns.rows[0],
      today: todaySummary.rows[0],
    }
  }

  async getWeeklySalesAndPurchases(db, tenantId) {
    // Recursive CTE to replace generate_series for last 7 days
    const query = `
        WITH RECURSIVE last_7_days(day) AS (
            SELECT date('now', '-6 days')
            UNION ALL
            SELECT date(day, '+1 day')
            FROM last_7_days
            WHERE day < date('now')
        )
        SELECT
            d.day AS day,
            COALESCE(s.total_sales, 0) AS "Sales",
            COALESCE(p.total_purchases, 0) AS "Purchases"
        FROM last_7_days d
        LEFT JOIN (
            SELECT date(date) AS day, SUM(total_amount) AS total_sales
            FROM sales
            WHERE tenant_id = $1 AND date(date) >= date('now', '-6 days')
            GROUP BY date(date)
        ) s ON d.day = s.day
        LEFT JOIN (
            SELECT date(date) AS day, SUM(total_amount) AS total_purchases
            FROM purchase
            WHERE tenant_id = $1 AND date(date) >= date('now', '-6 days')
            GROUP BY date(date)
        ) p ON d.day = p.day
        ORDER BY d.day;
    `
    const { rows } = await db.query(query, [tenantId])
    return rows
  }

  async getTopSellingProducts(db, tenantId, limit = 5) {
    const query = `
        SELECT i.name, SUM(si.quantity) as value
        FROM sale_item si
        JOIN item i ON si.item_id = i.id
        WHERE si.tenant_id = $1
        GROUP BY i.name
        ORDER BY value DESC
        LIMIT $2;
    `
    const { rows } = await db.query(query, [tenantId, limit])
    return rows
  }

  async getTopCustomers(db, tenantId, limit = 5) {
    const query = `
        SELECT pa.name, SUM(s.total_amount) as value
        FROM sales s
        JOIN party pa ON s.party_id = pa.id
        WHERE s.tenant_id = $1
        GROUP BY pa.name
        ORDER BY value DESC
        LIMIT $2;
    `
    const { rows } = await db.query(query, [tenantId, limit])
    return rows
  }

  async getStockAlerts(db, tenantId, limit = 5) {
    const query = `
      SELECT
        sku as code,
        name as product,
        stock_quantity as quantity,
        min_stock_level as alert_quantity
      FROM item
      WHERE tenant_id = $1 AND stock_quantity <= min_stock_level
      ORDER BY stock_quantity ASC
      LIMIT $2;
    `
    const { rows } = await db.query(query, [tenantId, limit])
    return rows
  }

  async getRecentSales(db, tenantId, limit = 5) {
    const query = `
      SELECT
        s.id as reference,
        pa.name as party,
        s.status,
        s.total_amount as "grandTotal",
        s.paid_amount as "paid",
        (s.total_amount - s.paid_amount) as "due",
        CASE
          WHEN s.paid_amount >= s.total_amount THEN 'Paid'
          WHEN s.paid_amount > 0 AND s.paid_amount < s.total_amount THEN 'Partial'
          ELSE 'Unpaid'
        END AS "paymentStatus"
      FROM sales s
      LEFT JOIN party pa ON s.party_id = pa.id
      WHERE s.tenant_id = $1
      ORDER BY s.date DESC, s.id DESC
      LIMIT $2;
    `
    const { rows } = await db.query(query, [tenantId, limit])
    return rows
  }

  async getRecentPurchases(db, tenantId, limit = 5) {
    const query = `
      SELECT
        p.id as reference,
        pa.name as party,
        p.total_amount as "grandTotal",
        p.paid_amount as "paid",
        (p.total_amount - p.paid_amount) as "due",
        CASE
          WHEN p.paid_amount >= p.total_amount THEN 'Paid'
          WHEN p.paid_amount > 0 AND p.paid_amount < p.total_amount THEN 'Partial'
          ELSE 'Unpaid'
        END AS "paymentStatus"
      FROM purchase p
      LEFT JOIN party pa ON p.party_id = pa.id
      WHERE p.tenant_id = $1
      ORDER BY p.date DESC, p.id DESC
      LIMIT $2;
    `
    const { rows } = await db.query(query, [tenantId, limit])
    return rows
  }

  async getRecentExpenses(db, tenantId, limit = 5) {
    const query = `
      SELECT
        e.id as reference,
        et.name as category,
        e.description,
        e.amount as "grandTotal",
        e.amount_paid as "paid",
        (e.amount - e.amount_paid) as "due",
        CASE
          WHEN e.amount_paid >= e.amount THEN 'Paid'
          WHEN e.amount_paid > 0 AND e.amount_paid < e.amount THEN 'Partial'
          ELSE 'Unpaid'
        END AS "paymentStatus"
      FROM expenses e
      LEFT JOIN "expense_type" et ON e.expense_type_id = et.id
      WHERE e.tenant_id = $1
      ORDER BY e.date DESC, e.id DESC
      LIMIT $2;
    `
    const { rows } = await db.query(query, [tenantId, limit])
    return rows
  }
}

module.exports = DashboardRepository;