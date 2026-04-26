module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='job_sheets';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "job_sheets" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE job_sheets (
          job_id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          party_id INT REFERENCES party(id) ON DELETE CASCADE, -- <<< UPDATED
          item_name VARCHAR(255) NOT NULL, -- <<< UPDATED (was item_id)
          servicer_id INT REFERENCES employee(id) ON DELETE SET NULL,
          done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
          cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL,
          issue_reported TEXT NOT NULL,
          diagnosis TEXT,
          status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed, Delivered
          service_cost DECIMAL(12,2) NOT NULL,
          service_charges DECIMAL(12,2) DEFAULT 0,
          estimated_completion_date DATE,
          invoice_number VARCHAR(100) NOT NULL,
          bar_code VARCHAR(255),
          account_id INTEGER REFERENCES account(id) ON DELETE CASCADE,
          completion_date DATE,
          remarks TEXT,
          date DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `)
      console.log('✅ "job_sheets" table created.')
      await client.query(
        `CREATE INDEX idx_job_sheets_tenant_id ON job_sheets(tenant_id);`
      ) //
      await client.query(
        `CREATE INDEX idx_job_sheets_party_id ON job_sheets(party_id);`
      ) // <<< UPDATED
      await client.query(
        `CREATE INDEX idx_job_sheets_status ON job_sheets(status);`
      )
      await client.query(
        `CREATE INDEX idx_job_sheets_servicer_id ON job_sheets(servicer_id);`
      )
      await client.query(
        `CREATE INDEX idx_job_sheets_done_by_id ON job_sheets(done_by_id);`
      )
      await client.query(
        `CREATE INDEX idx_job_sheets_cost_center_id ON job_sheets(cost_center_id);`
      )
      console.log('✅ Indexes for "job_sheets" table created.')
    }
  } catch (err) {
    console.error('❌ Error creating "job_sheets" table:', err.message)
    throw err
  }
}
