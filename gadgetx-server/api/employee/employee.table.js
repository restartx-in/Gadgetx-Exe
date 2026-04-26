module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='employee';
    `)

    const tableExists = result.rows.length > 0
    if (tableExists) {
      console.log('ℹ️ "employee" table already exists.')
    } else {
      await client.query(`
      CREATE TABLE employee (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address VARCHAR(255),
        employee_position_id INTEGER REFERENCES "employee_position"(id) ON DELETE SET NULL,
        done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
        cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL,
        salary DECIMAL(12, 2),
        hire_date DATE,
        photos TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
      console.log('✅ "employee" table created.')

      const indexQueries = [
        `CREATE INDEX idx_employee_tenant_id ON employee(tenant_id);`,
        `CREATE INDEX idx_employee_position_id ON employee(employee_position_id);`,
        `CREATE INDEX idx_employee_done_by_id ON employee(done_by_id);`,
        `CREATE INDEX idx_employee_cost_center_id ON employee(cost_center_id);`
      ];
      for (let q of indexQueries) {
        await client.query(q);
      }
      console.log('✅ Indexes for employee table created.')
    }
  } catch (err) {
    console.error('❌ Error creating "employee" table:', err.message)
  }
}
