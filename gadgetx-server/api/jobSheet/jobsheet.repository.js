class JobSheetsRepository {

  async getByUserId(db, tenantId, filters = {}) {
    const { sort, searchType, searchKey, ...otherFilters } = filters

    let query = `
      SELECT 
          js.*,
          pa.name as party_name,
          emp.name as servicer_name,
          db.name AS done_by_name,
          cc.name AS cost_center_name
      FROM job_sheets js
      JOIN party pa ON js.party_id = pa.id
      LEFT JOIN employee emp ON js.servicer_id = emp.id
      LEFT JOIN "done_by" db ON js.done_by_id = db.id
      LEFT JOIN "cost_center" cc ON js.cost_center_id = cc.id
      WHERE js.tenant_id = $1
    `
    const params = [tenantId]
    let paramIndex = 2

    const filterConfig = {
      status: { operator: '=', column: 'js.status' },
      item_name: { operator: 'ILIKE', column: 'js.item_name', isString: true },
      party_id: { operator: '=', column: 'js.party_id' },
      party_name: { operator: 'ILIKE', column: 'pa.name', isString: true },
      servicer_name: { operator: 'ILIKE', column: 'emp.name', isString: true },
      service_charges: { operator: '=', column: 'js.service_charges' },
      service_cost: { operator: '=', column: 'js.service_cost' },
      min_charges: { operator: '>=', column: 'js.service_charges' },
      max_charges: { operator: '<=', column: 'js.service_charges' },
      start_date: { operator: '>=', column: 'js.created_at' },
      end_date: { operator: '<=', column: 'js.created_at' },
      done_by_id: { operator: '=', column: 'js.done_by_id' },
      cost_center_id: { operator: '=', column: 'js.cost_center_id' },
      invoice_number: { operator: '=', column: 'js.invoice_number' },
      account_id: { operator: '=', column: 'js.account_id' },
      bar_code: { operator: '=', column: 'js.bar_code' },
    }

    Object.keys(otherFilters).forEach((key) => {
      if (
        otherFilters[key] != null &&
        otherFilters[key] !== '' &&
        filterConfig[key]
      ) {
        const { operator, column, isString } = filterConfig[key]
        let value = isString ? `%${otherFilters[key]}%` : otherFilters[key]
        query += ` AND ${column} ${operator} $${paramIndex}`
        params.push(value)
        paramIndex++
      }
    })

    const searchConfig = {
      party_name: { operator: 'ILIKE', column: 'pa.name' },
      item_name: { operator: 'ILIKE', column: 'js.item_name' },
      bar_code: { operator: 'ILIKE', column: 'js.bar_code' },
      servicer_name: { operator: 'ILIKE', column: 'emp.name' },
      issue_reported: { operator: 'ILIKE', column: 'js.issue_reported' },
      status: { operator: 'ILIKE', column: 'js.status' },
      invoice_number: { operator: 'ILIKE', column: 'js.invoice_number' },
    }

    if (
      searchType &&
      searchKey != null &&
      searchKey !== '' &&
      searchConfig[searchType]
    ) {
      const { operator, column } = searchConfig[searchType]
      let value = operator === 'ILIKE' ? `%${searchKey}%` : searchKey
      query += ` AND ${column} ${operator} $${paramIndex}`
      params.push(value)
      paramIndex++
    }

    const allowedSortColumns = {
      created_at: 'js.created_at',
      status: 'js.status',
      party_name: 'pa.name',
      item_name: 'js.item_name',
      servicer_name: 'emp.name',
      service_charges: 'js.service_charges',
      estimated_completion_date: 'js.estimated_completion_date',
      done_by: 'db.name',
      cost_center: 'cc.name',
      invoice_number: 'js.invoice_number',
      account_id: 'js.account_id',
      bar_code: 'js.bar_code',
    }

    if (sort) {
      const direction = sort.startsWith('-') ? 'DESC' : 'ASC'
      const columnKey = sort.startsWith('-') ? sort.substring(1) : sort
      const dbColumn = allowedSortColumns[columnKey]
      if (dbColumn) {
        query += ` ORDER BY ${dbColumn} ${direction}, js.job_id DESC`
      } else {
        query += ' ORDER BY js.created_at DESC, js.job_id DESC'
      }
    } else {
      query += ' ORDER BY js.created_at DESC, js.job_id DESC'
    }

    const { rows } = await db.query(query, params)
    return rows
  }

  async getPaginatedByUserId(db, tenantId, filters = {}) {
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

    let query = `
      SELECT 
          js.*,
          pa.name as party_name,
          emp.name as servicer_name,
          db.name AS done_by_name,
          cc.name AS cost_center_name,
          COUNT(*) OVER() as total_count
      FROM job_sheets js
      JOIN party pa ON js.party_id = pa.id
      LEFT JOIN employee emp ON js.servicer_id = emp.id
      LEFT JOIN "done_by" db ON js.done_by_id = db.id
      LEFT JOIN "cost_center" cc ON js.cost_center_id = cc.id
      WHERE js.tenant_id = $1
    `
    const params = [tenantId]
    let paramIndex = 2

    const filterConfig = {
      status: { operator: '=', column: 'js.status' },
      item_name: { operator: 'ILIKE', column: 'js.item_name', isString: true },
      party_id: { operator: '=', column: 'js.party_id' },
      party_name: { operator: 'ILIKE', column: 'pa.name', isString: true },
      servicer_name: { operator: 'ILIKE', column: 'emp.name', isString: true },
      service_charges: { operator: '=', column: 'js.service_charges' },
      service_cost: { operator: '=', column: 'js.service_cost' },
      min_charges: { operator: '>=', column: 'js.service_charges' },
      max_charges: { operator: '<=', column: 'js.service_charges' },
      start_date: { operator: '>=', column: 'js.created_at' },
      end_date: { operator: '<=', column: 'js.created_at' },
      customer_name: { operator: 'ILIKE', column: 'c.name', isString: true },
      done_by_id: { operator: '=', column: 'js.done_by_id' },
      cost_center_id: { operator: '=', column: 'js.cost_center_id' },
      invoice_number: { operator: '=', column: 'js.invoice_number' },
      account_id: { operator: '=', column: 'js.account_id' },
      bar_code: { operator: '=', column: 'js.bar_code' },
    }
    Object.keys(otherFilters).forEach((key) => {
      if (
        otherFilters[key] != null &&
        otherFilters[key] !== '' &&
        filterConfig[key]
      ) {
        const { operator, column, isString } = filterConfig[key]
        let value = isString ? `%${otherFilters[key]}%` : otherFilters[key]
        query += ` AND ${column} ${operator} $${paramIndex}`
        params.push(value)
        paramIndex++
      }
    })

    const searchConfig = {
      party_name: { operator: 'ILIKE', column: 'pa.name' },
      item_name: { operator: 'ILIKE', column: 'js.item_name' },
      bar_code: { operator: 'ILIKE', column: 'js.bar_code' },
      servicer_name: { operator: 'ILIKE', column: 'emp.name' },
      issue_reported: { operator: 'ILIKE', column: 'js.issue_reported' },
      status: { operator: 'ILIKE', column: 'js.status' },
      invoice_number: { operator: 'ILIKE', column: 'js.invoice_number' },
    }

    if (
      searchType &&
      searchKey != null &&
      searchKey !== '' &&
      searchConfig[searchType]
    ) {
      const { operator, column } = searchConfig[searchType]
      let value = operator === 'ILIKE' ? `%${searchKey}%` : searchKey
      query += ` AND ${column} ${operator} $${paramIndex}`
      params.push(value)
      paramIndex++
    }

    const allowedSortColumns = {
      created_at: 'js.created_at',
      status: 'js.status',
      party_name: 'pa.name',
      item_name: 'js.item_name',
      servicer_name: 'emp.name',
      service_charges: 'js.service_charges',
      estimated_completion_date: 'js.estimated_completion_date',
      done_by: 'db.name',
      cost_center: 'cc.name',
      invoice_number: 'js.invoice_number',
      account_id: 'js.account_id',
      bar_code: 'js.bar_code',
    }

    if (sort) {
      const direction = sort.startsWith('-') ? 'DESC' : 'ASC'
      const columnKey = sort.startsWith('-') ? sort.substring(1) : sort
      const dbColumn = allowedSortColumns[columnKey]
      if (dbColumn) {
        query += ` ORDER BY ${dbColumn} ${direction}, js.job_id DESC`
      } else {
        query += ' ORDER BY js.created_at DESC, js.job_id DESC'
      }
    } else {
      query += ' ORDER BY js.created_at DESC, js.job_id DESC'
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const { rows } = await db.query(query, params)
    const totalCount = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0
    const jobSheets = rows.map(({ total_count, ...rest }) => rest)
    return { jobSheets, totalCount }
  }

  async create(db, tenantId, data) {
    const { rows } = await db.query(
      `INSERT INTO job_sheets(tenant_id, party_id, item_name, servicer_id, issue_reported, diagnosis, status, service_charges, estimated_completion_date, completion_date, remarks, service_cost, done_by_id, cost_center_id, invoice_number, account_id, bar_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [
        tenantId,
        data.party_id,
        data.item_name,
        data.servicer_id,
        data.issue_reported,
        data.diagnosis,
        data.status,
        data.service_charges,
        data.estimated_completion_date,
        data.completion_date,
        data.remarks,
        data.service_cost,
        data.done_by_id,
        data.cost_center_id,
        data.invoice_number,
        data.account_id,
        data.bar_code,
      ]
    )
    return rows[0]
  }

  async getById(db, id, tenantId) {
    const { rows } = await db.query(
      `SELECT 
          js.*, 
          p.name as party_name, 
          emp.name as servicer_name, 
          db.name AS done_by_name, 
          cc.name AS cost_center_name
       FROM job_sheets js
       JOIN party p ON js.party_id = p.id
       LEFT JOIN employee emp ON js.servicer_id = emp.id
       LEFT JOIN "done_by" db ON js.done_by_id = db.id
       LEFT JOIN "cost_center" cc ON js.cost_center_id = cc.id
       WHERE js.job_id = $1 AND js.tenant_id = $2
      `,
      [id, tenantId]
    )
    return rows[0]
  }

  async update(db, id, tenantId, data) {
    const { rows } = await db.query(
      `UPDATE job_sheets
       SET party_id = $1, item_name = $2, servicer_id = $3, issue_reported = $4, diagnosis = $5, 
           status = $6, service_charges = $7, estimated_completion_date = $8, completion_date = $9, 
           remarks = $10, service_cost = $11, done_by_id = $12, cost_center_id = $13, 
           invoice_number = $14, account_id = $15, bar_code = $16, updated_at = CURRENT_TIMESTAMP
       WHERE job_id = $17 AND tenant_id = $18
       RETURNING *`,
      [
        data.party_id,
        data.item_name,
        data.servicer_id,
        data.issue_reported,
        data.diagnosis,
        data.status,
        data.service_charges,
        data.estimated_completion_date,
        data.completion_date,
        data.remarks,
        data.service_cost,
        data.done_by_id,
        data.cost_center_id,
        data.invoice_number,
        data.account_id,
        data.bar_code,
        id,
        tenantId,
      ]
    )
    return rows[0]
  }

  async delete(db, id, tenantId) {
    const { rows } = await db.query(
      'DELETE FROM job_sheets WHERE job_id = $1 AND tenant_id = $2 RETURNING job_id',
      [id, tenantId]
    )
    return rows[0]
  }
}
module.exports = JobSheetsRepository