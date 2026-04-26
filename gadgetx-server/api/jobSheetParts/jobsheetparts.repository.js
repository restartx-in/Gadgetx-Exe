class JobSheetPartsRepository {
  // constructor removed

  async getAllByTenantId(db, tenantId, filters = {}) {
    const { sort, searchType, searchKey, ...otherFilters } = filters;

    let query = `
            SELECT 
                jsp.*,
                i.name as item_name,
                js.issue_reported as job_sheet_issue
            FROM job_sheet_parts jsp
            JOIN item i ON jsp.item_id = i.id
            JOIN job_sheets js ON jsp.job_id = js.job_id
            WHERE jsp.tenant_id = $1
        `;
    const params = [tenantId];
    let paramIndex = 2;

    const filterConfig = {
      job_id: { operator: "=", column: "jsp.job_id" },
      item_name: { operator: "ILIKE", column: "i.name", isString: true },
      min_quantity: { operator: ">=", column: "jsp.quantity" },
      max_quantity: { operator: "<=", column: "jsp.quantity" },
      min_cost: { operator: ">=", column: "jsp.cost" },
      max_cost: { operator: "<=", column: "jsp.cost" },
    };

    Object.keys(otherFilters).forEach((key) => {
      if (
        otherFilters[key] != null &&
        otherFilters[key] !== "" &&
        filterConfig[key]
      ) {
        const { operator, column, isString } = filterConfig[key];
        let value = otherFilters[key];
        if (isString) value = `%${value}%`;
        query += ` AND ${column} ${operator} $${paramIndex}`;
        params.push(value);
        paramIndex++;
      }
    });

    const searchConfig = {
      item_name: { operator: "ILIKE", column: "i.name" },
      job_sheet_issue: { operator: "ILIKE", column: "js.issue_reported" },
    };

    if (searchType && searchKey != null && searchKey !== "") {
      if (searchConfig[searchType]) {
        const { operator, column } = searchConfig[searchType];
        const value = operator === "ILIKE" ? `%${searchKey}%` : searchKey;
        query += ` AND ${column} ${operator} $${paramIndex}`;
        params.push(value);
        paramIndex++;
      }
    }

    const allowedSortColumns = {
      created_at: "jsp.created_at",
      item_name: "i.name",
      quantity: "jsp.quantity",
      cost: "jsp.cost",
    };

    if (sort) {
      const direction = sort.startsWith("-") ? "DESC" : "ASC";
      const columnKey = sort.startsWith("-") ? sort.substring(1) : sort;
      const dbColumn = allowedSortColumns[columnKey];
      if (dbColumn) {
        query += ` ORDER BY ${dbColumn} ${direction}, jsp.id DESC`;
      } else {
        query += " ORDER BY jsp.created_at DESC, jsp.id DESC";
      }
    } else {
      query += " ORDER BY jsp.created_at DESC, jsp.id DESC";
    }

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

    let query = `
            SELECT 
                jsp.*,
                i.name as item_name,
                js.issue_reported as job_sheet_issue,
                COUNT(*) OVER() as total_count
            FROM job_sheet_parts jsp
            JOIN item i ON jsp.item_id = i.id
            JOIN job_sheets js ON jsp.job_id = js.job_id
            WHERE jsp.tenant_id = $1
        `;
    const params = [tenantId];
    let paramIndex = 2;

    const filterConfig = {
      job_id: { operator: "=", column: "jsp.job_id" },
      item_name: { operator: "ILIKE", column: "i.name", isString: true },
      min_quantity: { operator: ">=", column: "jsp.quantity" },
      max_quantity: { operator: "<=", column: "jsp.quantity" },
      min_cost: { operator: ">=", column: "jsp.cost" },
      max_cost: { operator: "<=", column: "jsp.cost" },
    };

    Object.keys(otherFilters).forEach((key) => {
      if (
        otherFilters[key] != null &&
        otherFilters[key] !== "" &&
        filterConfig[key]
      ) {
        const { operator, column, isString } = filterConfig[key];
        let value = otherFilters[key];
        if (isString) value = `%${value}%`;
        query += ` AND ${column} ${operator} $${paramIndex}`;
        params.push(value);
        paramIndex++;
      }
    });

    const searchConfig = {
      item_name: { operator: "ILIKE", column: "i.name" },
      job_sheet_issue: { operator: "ILIKE", column: "js.issue_reported" },
    };

    if (searchType && searchKey != null && searchKey !== "") {
      if (searchConfig[searchType]) {
        const { operator, column } = searchConfig[searchType];
        const value = operator === "ILIKE" ? `%${searchKey}%` : searchKey;
        query += ` AND ${column} ${operator} $${paramIndex}`;
        params.push(value);
        paramIndex++;
      }
    }

    const allowedSortColumns = {
      created_at: "jsp.created_at",
      item_name: "i.name",
      quantity: "jsp.quantity",
      cost: "jsp.cost",
    };

    if (sort) {
      const direction = sort.startsWith("-") ? "DESC" : "ASC";
      const columnKey = sort.startsWith("-") ? sort.substring(1) : sort;
      const dbColumn = allowedSortColumns[columnKey];
      if (dbColumn) {
        query += ` ORDER BY ${dbColumn} ${direction}, jsp.id DESC`;
      } else {
        query += " ORDER BY jsp.created_at DESC, jsp.id DESC";
      }
    } else {
      query += " ORDER BY jsp.created_at DESC, jsp.id DESC";
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);

    const totalCount = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    const jobSheetParts = rows.map(({ total_count, ...rest }) => rest);

    return { jobSheetParts, totalCount };
  }

  async create(db, partData) {
    const { tenant_id, job_id, item_id, quantity, cost } = partData;
    const { rows } = await db.query(
      `INSERT INTO job_sheet_parts(tenant_id, job_id, item_id, quantity, cost)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
      [tenant_id, job_id, item_id, quantity, cost]
    );
    return rows[0];
  }

  async getById(db, id, tenantId) {
    const { rows } = await db.query(
      `SELECT jsp.*, i.name as item_name, js.issue_reported as job_sheet_issue 
             FROM job_sheet_parts jsp
             JOIN item i ON jsp.item_id = i.id
             JOIN job_sheets js ON jsp.job_id = js.job_id
             WHERE jsp.id = $1 AND jsp.tenant_id = $2`,
      [id, tenantId]
    );
    return rows[0];
  }

  async update(db, id, tenantId, partData) {
    const { job_id, item_id, quantity, cost } = partData;
    const { rows } = await db.query(
      `UPDATE job_sheet_parts
             SET job_id = $1, item_id = $2, quantity = $3, cost = $4
             WHERE id = $5 AND tenant_id = $6
             RETURNING *`,
      [job_id, item_id, quantity, cost, id, tenantId]
    );
    return rows[0];
  }

  async delete(db, id, tenantId) {
    const { rows } = await db.query(
      `DELETE FROM job_sheet_parts
             WHERE id = $1 AND tenant_id = $2
             RETURNING id`,
      [id, tenantId]
    );
    return rows[0];
  }
}

module.exports = JobSheetPartsRepository;