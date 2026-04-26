class ModeOfPaymentRepository {

  async create(db, modeOfPaymentData) { // RECEIVE db
    const { tenant_id, name, done_by_id, cost_center_id } = modeOfPaymentData;
    const { rows } = await db.query( // USE db
      `INSERT INTO mode_of_payment (tenant_id, name, done_by_id, cost_center_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tenant_id, name, done_by_id, cost_center_id]
    );
    return rows[0];
  }

  async getAll(db, tenantId, filters = {}) { // RECEIVE db
    let query = 'SELECT mop.*, db.name as done_by_name, cc.name as cost_center_name FROM mode_of_payment mop LEFT JOIN "done_by" db ON mop.done_by_id = db.id LEFT JOIN "cost_center" cc ON mop.cost_center_id = cc.id WHERE mop.tenant_id = $1';
    const params = [tenantId];
    
    if (filters.name) {
        query += ' AND mop.name ILIKE $2';
        params.push(`%${filters.name}%`);
    }

    query += ' ORDER BY mop.id ASC';

    const { rows } = await db.query(query, params); // USE db
    return rows;
  }

  async getById(db, id, tenantId) { // RECEIVE db
    const query = `SELECT mop.*, db.name as done_by_name, cc.name as cost_center_name FROM mode_of_payment mop LEFT JOIN "done_by" db ON mop.done_by_id = db.id LEFT JOIN "cost_center" cc ON mop.cost_center_id = cc.id WHERE mop.id = $1 AND mop.tenant_id = $2`;
    const { rows } = await db.query(query, [id, tenantId]); // USE db
    return rows[0];
  }

  async update(db, id, tenantId, data) { // RECEIVE db
    const fieldsToUpdate = {};
    if (data.name) fieldsToUpdate.name = data.name;
    if (data.done_by_id !== undefined) fieldsToUpdate.done_by_id = data.done_by_id; // Check for undefined to allow setting to null
    if (data.cost_center_id !== undefined) fieldsToUpdate.cost_center_id = data.cost_center_id; // Check for undefined to allow setting to null

    const fields = Object.keys(fieldsToUpdate);
    if (fields.length === 0) return this.getById(db, id, tenantId); // PASS db

    const values = Object.values(fieldsToUpdate);
    const setClause = fields.map((field, index) => `"${field}" = $${index + 1}`).join(", ");

    const query = `
        UPDATE mode_of_payment SET ${setClause}
        WHERE id = $${fields.length + 1} AND tenant_id = $${fields.length + 2}
        RETURNING *
    `;
    const { rows } = await db.query(query, [...values, id, tenantId]); // USE db
    return rows[0];
  }

  async delete(db, id, tenantId) { // RECEIVE db
    const { rows } = await db.query( // USE db
      "DELETE FROM mode_of_payment WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [id, tenantId]
    );
    return rows[0];
  }
}

module.exports = ModeOfPaymentRepository;