module.exports = async (client) => {
  try {
    const defaultSidebarLabels = JSON.stringify({
      dashboard: 'Dashboard', sales: 'Sales', sale_return: 'Sale Return',
      employees: 'Employees', expenses: 'Expenses', partnerships: 'Partnerships',
      purchase: 'Purchase', purchase_return: 'Purchase Return',
      daily_summary: 'Daily Summary', monthly_summary: 'Monthly Summary',
      reports: 'Reports', lists: 'Lists',
    });

    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='settings';
    `)
    const tableExists = result.rows.length > 0

    if (!tableExists) {
      await client.query(`
        CREATE TABLE settings (
          user_id INTEGER PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
          tenant_id INTEGER REFERENCES "tenant"(id) ON DELETE CASCADE, 
          app_name TEXT DEFAULT 'WheelX',
          logo TEXT,
          sidebar_labels TEXT DEFAULT '${defaultSidebarLabels}',
          country TEXT,
          user_settings TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ "settings" table created.');
    }

    await client.query(`DROP TRIGGER IF EXISTS update_settings_updated_at;`);
    await client.query(`
      CREATE TRIGGER update_settings_updated_at
      AFTER UPDATE ON settings
      FOR EACH ROW
      WHEN NEW.updated_at = OLD.updated_at
      BEGIN
        UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE user_id = OLD.user_id;
      END;
    `);
    console.log('✅ Trigger for "settings.updated_at" created.');

    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_settings_tenant_id ON settings(tenant_id);`
    );

  } catch (err) {
    console.error(
      '❌ Failed to create or update "settings" table:',
      err.message
    );
    throw err;
  }
};