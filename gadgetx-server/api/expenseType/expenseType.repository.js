class ExpenseTypeRepository {
  
  async getAllByUserId(db, tenantId) {
    const { rows } = await db.query(
      `SELECT * FROM "expense_type" 
             WHERE tenant_id = $1 
             ORDER BY created_at DESC`,
      [tenantId]
    );
    return rows;
  }

  async create(db, expenseTypeData) {
    const { tenant_id, name } = expenseTypeData;
    const { rows } = await db.query(
      `INSERT INTO "expense_type" (tenant_id, name)
             VALUES ($1, $2)
             RETURNING *`,
      [tenant_id, name]
    );
    return rows[0];
  }

  async getById(db, id, tenantId) {
    const { rows } = await db.query(
      `SELECT * FROM "expense_type" 
             WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return rows[0];
  }

  async update(db, id, tenantId, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);

    if (fields.length === 0) {
      return this.getById(db, id, tenantId);
    }

    const setClause = fields
      .map((field, index) => `"${field}" = $${index + 1}`)
      .join(", ");

    const query = `
            UPDATE "expense_type"
            SET ${setClause}
            WHERE id = $${fields.length + 1} AND tenant_id = $${
      fields.length + 2
    }
            RETURNING *
        `;
    const queryValues = [...values, id, tenantId];

    const { rows } = await db.query(query, queryValues);
    return rows[0];
  }

  async delete(db, id, tenantId) {
    const { rows } = await db.query(
      `DELETE FROM "expense_type" 
             WHERE id = $1 AND tenant_id = $2
             RETURNING id`,
      [id, tenantId]
    );
    return rows[0];
  }
}

module.exports = ExpenseTypeRepository;