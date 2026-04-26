class ExpenseRepository {
  async create(db, expenseData) {
    const {
      tenant_id,
      description,
      amount,
      expense_type_id,
      date,
      account_id,
      amount_paid,
      done_by_id,
      cost_center_id,
    } = expenseData;

    const { rows } = await db.query(
      `INSERT INTO expenses (
        tenant_id, description, amount, expense_type_id, date, 
        account_id, amount_paid, done_by_id, cost_center_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        tenant_id,
        description,
        amount,
        expense_type_id,
        date || new Date().toISOString(),
        account_id,
        amount_paid || 0,
        done_by_id,
        cost_center_id,
      ]
    );
    return rows[0];
  }

  async getAllByTenantId(db, tenantId, filters = {}) {
    const { sort, searchType, searchKey, ...otherFilters } = filters;

    let query = `
            SELECT 
                e.*, 
                et.name as category, 
                a.name as account_name,
                db.name as done_by_name,
                cc.name as cost_center_name
            FROM expenses e
            LEFT JOIN "expense_type" et ON e.expense_type_id = et.id
            LEFT JOIN account a ON e.account_id = a.id
            LEFT JOIN "done_by" db ON e.done_by_id = db.id
            LEFT JOIN "cost_center" cc ON e.cost_center_id = cc.id
        `;
    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (tenantId) {
      conditions.push(`e.tenant_id = $${paramIndex++}`);
      params.push(tenantId);
    }

    const filterConfig = {
      category: { operator: "=", column: "et.name" },
      account_id: { operator: "=", column: "e.account_id" },
      done_by_id: { operator: "=", column: "e.done_by_id" },
      cost_center_id: { operator: "=", column: "e.cost_center_id" },
      amount: { operator: "=", column: "e.amount" },
      amount_paid: { operator: "=", column: "e.amount_paid" },
      min_amount: { operator: ">=", column: "e.amount" },
      max_amount: { operator: "<=", column: "e.amount" },
      start_date: { operator: ">=", column: "e.date" },
      end_date: { operator: "<=", column: "e.date" },
    };

    Object.keys(otherFilters).forEach((key) => {
      if (
        otherFilters[key] != null &&
        otherFilters[key] !== "" &&
        filterConfig[key]
      ) {
        conditions.push(
          ` ${filterConfig[key].column} ${
            filterConfig[key].operator
          } $${paramIndex++}`
        );
        params.push(otherFilters[key]);
      }
    });

    if (
      searchType &&
      searchKey != null &&
      searchKey !== ""
    ) {
      const searchConfig = {
        description: { operator: "LIKE", column: "e.description" },
        category: { operator: "LIKE", column: "et.name" },
        amount: { operator: "=", column: "e.amount" },
        amount_paid: { operator: "=", column: "e.amount_paid" },
        account_name: { operator: "LIKE", column: "a.name" },
        done_by_name: { operator: "LIKE", column: "db.name" },
        cost_center_name: { operator: "LIKE", column: "cc.name" },
      };
      if (searchConfig[searchType]) {
        const { operator, column } = searchConfig[searchType];
        conditions.push(` ${column} ${operator} $${paramIndex++}`);
        params.push(operator === "LIKE" ? `%${searchKey}%` : searchKey);
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += " ORDER BY e.date DESC, e.id DESC";

    const { rows } = await db.query(query, params);
    return rows;
  }

  async getPaginatedByTenantId(db, tenantId, filters = {}) {
    const {
      page = 1,
      page_size = 10,
      sort,
      searchType,
      searchKey,
      ...otherFilters
    } = filters;
    const limit = parseInt(page_size, 10);
    const offset = (parseInt(page, 10) - 1) * limit;

    const fromClause = `FROM expenses e 
                        LEFT JOIN "expense_type" et ON e.expense_type_id = et.id
                        LEFT JOIN account a ON e.account_id = a.id
                        LEFT JOIN "done_by" db ON e.done_by_id = db.id
                        LEFT JOIN "cost_center" cc ON e.cost_center_id = cc.id`;

    const params = [];
    const conditions = [];
    let paramIndex = 1;

    if (tenantId) {
      conditions.push(`e.tenant_id = $${paramIndex++}`);
      params.push(tenantId);
    }

    const filterConfig = {
      category: { operator: "=", column: "et.name" },
      account_id: { operator: "=", column: "e.account_id" },
      done_by_id: { operator: "=", column: "e.done_by_id" },
      cost_center_id: { operator: "=", column: "e.cost_center_id" },
      amount: { operator: "=", column: "e.amount" },
      amount_paid: { operator: "=", column: "e.amount_paid" },
      min_amount: { operator: ">=", column: "e.amount" },
      max_amount: { operator: "<=", column: "e.amount" },
      start_date: { operator: ">=", column: "e.date" },
      end_date: { operator: "<=", column: "e.date" },
    };

    Object.keys(otherFilters).forEach((key) => {
      if (
        otherFilters[key] != null &&
        otherFilters[key] !== "" &&
        filterConfig[key]
      ) {
        conditions.push(
          ` ${filterConfig[key].column} ${
            filterConfig[key].operator
          } $${paramIndex++}`
        );
        params.push(otherFilters[key]);
      }
    });

    if (
      searchType &&
      searchKey != null &&
      searchKey !== ""
    ) {
      const searchConfig = {
        description: { operator: "LIKE", column: "e.description" },
        category: { operator: "LIKE", column: "et.name" },
        amount: { operator: "=", column: "e.amount" },
        amount_paid: { operator: "=", column: "e.amount_paid" },
        account_name: { operator: "LIKE", column: "a.name" },
        done_by_name: { operator: "LIKE", column: "db.name" },
        cost_center_name: { operator: "LIKE", column: "cc.name" },
      };
      if (searchConfig[searchType]) {
        const { operator, column } = searchConfig[searchType];
        conditions.push(` ${column} ${operator} $${paramIndex++}`);
        params.push(operator === "LIKE" ? `%${searchKey}%` : searchKey);
      }
    }

    const whereClause =
      conditions.length > 0 ? ` WHERE ` + conditions.join(" AND ") : "";

    const aggregationQuery = `SELECT COALESCE(SUM(e.amount), 0) as total_amount, COALESCE(SUM(e.amount_paid), 0) as total_amount_paid ${fromClause}${whereClause}`;

    let mainQuery = `SELECT e.*, et.name as category, a.name as account_name, db.name as done_by_name, cc.name as cost_center_name ${fromClause}${whereClause}`;

    mainQuery += " ORDER BY e.date DESC, e.id DESC";
    mainQuery += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    const mainQueryParams = [...params, limit, offset];

    const [mainResult, aggregationResult] = await Promise.all([
      db.query(mainQuery, mainQueryParams),
      db.query(aggregationQuery, params),
    ]);

    const { rows } = mainResult;
    const aggregationData = aggregationResult.rows[0];

    return {
      expenses: rows,
      totalCount: rows.length > 0 ? 1000 : 0,
      total_amount: aggregationData.total_amount,
      total_amount_paid: aggregationData.total_amount_paid,
    };
  }

  async getById(db, id, tenantId) {
    const { rows } = await db.query(
      `SELECT e.*, et.name as category, a.name as account_name, db.name as done_by_name, cc.name as cost_center_name 
       FROM expenses e 
       LEFT JOIN "expense_type" et ON e.expense_type_id = et.id 
       LEFT JOIN account a ON e.account_id = a.id 
       LEFT JOIN "done_by" db ON e.done_by_id = db.id 
       LEFT JOIN "cost_center" cc ON e.cost_center_id = cc.id 
       WHERE e.id = $1 AND e.tenant_id = $2`,
      [id, tenantId]
    );
    return rows[0];
  }

  async update(db, id, tenantId, data) {
    const { transaction_type, ...cleanData } = data;
    const fields = Object.keys(cleanData);
    const values = Object.values(cleanData);
    if (fields.length === 0) return this.getById(db, id, tenantId);
    const setClause = fields.map((field, index) => `"${field}" = $${index + 1}`).join(", ");
    const query = `UPDATE expenses SET ${setClause} WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2} RETURNING *`;
    const { rows } = await db.query(query, [...values, id, tenantId]);
    return rows[0];
  }

  async delete(db, id, tenantId) {
    const { rows } = await db.query(
      "DELETE FROM expenses WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [id, tenantId]
    );
    return rows[0];
  }
}

module.exports = ExpenseRepository;
