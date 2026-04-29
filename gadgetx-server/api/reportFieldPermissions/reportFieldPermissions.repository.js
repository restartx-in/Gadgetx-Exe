class ReportFieldPermissionsRepository {
  async getByUserId(db, userId, tenantId) {
    const query = `
      SELECT * FROM report_field_permissions
      WHERE user_id = $1 AND tenant_id = $2;
    `;
    const { rows } = await db.query(query, [userId, tenantId]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async getById(db, id, tenantId) {
    const query = `
        SELECT * FROM report_field_permissions
        WHERE id = $1 AND tenant_id = $2;
    `;
    const { rows } = await db.query(query, [id, tenantId]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  async create(db, data) {
    const { user_id, tenant_id, ...fields } = data;
    const columns = ['user_id', 'tenant_id'];
    const values = [user_id, tenant_id];
    const placeholders = ['$1', '$2'];
    let paramIndex = 3;

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        columns.push(key);
        values.push(value);
        placeholders.push(`$${paramIndex++}`);
      }
    }

    const queryStr = `
      INSERT INTO report_field_permissions (${columns.join(', ')})
      VALUES (${placeholders.join(', ')});
    `;

    // Execute insert. db.js shim handles returning result for inserts via lastID
    const result = await db.query(queryStr, values);
    
    // Fetch the newly created record
    const newId = result.lastID || (result.rows && result.rows[0] ? result.rows[0].id : null);
    if (newId) {
        return this.getById(db, newId, tenantId);
    }
    return this.getByUserId(db, user_id, tenant_id);
  }

  async update(db, id, tenantId, data) {
    const {
      id: dataId,
      user_id,
      tenant_id,
      created_at,
      updated_at,
      ...fieldsToUpdate
    } = data;

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(fieldsToUpdate)) {
      setClauses.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }

    if (setClauses.length === 0) {
      return this.getById(db, id, tenantId);
    }

    const queryStr = `
      UPDATE report_field_permissions
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++};
    `;

    // SQLite doesn't support RETURNING on UPDATE in this environment
    await db.query(queryStr, [...values, id, tenantId]);
    
    // Fetch and return the updated record manually
    return this.getById(db, id, tenantId);
  }
}

module.exports = ReportFieldPermissionsRepository;