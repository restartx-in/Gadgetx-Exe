
module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='purchase_return';
    `)

    const tableExists = result.rows.length > 0

    if (tableExists) {
      console.log('ℹ️ "purchase_return" table already exists.')
    } else {
      await client.query(`
        CREATE TABLE purchase_return (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          purchase_id INTEGER NOT NULL REFERENCES purchase(id) ON DELETE CASCADE,
          item_id INTEGER NOT NULL REFERENCES item(id),
          done_by_id INTEGER REFERENCES "done_by"(id) ON DELETE SET NULL,
          cost_center_id INTEGER REFERENCES "cost_center"(id) ON DELETE SET NULL,
          return_quantity INTEGER NOT NULL,
          date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          reason TEXT,
          invoice_number VARCHAR(100) NOT NULL,
          total_refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
          refunded_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
          status VARCHAR(50) NOT NULL DEFAULT 'pending'
        );
      `)
      console.log('✅ "purchase_return" table has been created.')

      // Indexes...
      await client.query(`CREATE INDEX idx_purchase_return_tenant_id ON purchase_return(tenant_id);`);
      await client.query(`CREATE INDEX idx_purchase_return_purchase_id ON purchase_return(purchase_id);`);
      await client.query(
        `CREATE INDEX  idx_purchase_return_item_id ON purchase_return(item_id);`
      )
      await client.query(
        `CREATE INDEX  idx_purchase_return_done_by_id ON purchase_return(done_by_id);`
      )
      await client.query(
        `CREATE INDEX  idx_purchase_return_cost_center_id ON purchase_return(cost_center_id);`
      )
    }    
  } catch (err) {
    console.error('❌ Failed to create/update "purchase_return" table:', err.message)
    throw err
  }
}