module.exports = async (client) => {
  try {
    const result = await client.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='token';
    `);

    const tableExists = result.rows.length > 0;
    if (tableExists) {
      console.log('ℹ️ "token" table already exists.');
    } else {
      await client.query(`
        CREATE TABLE token (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
          refresh_token TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ "token" table created.');

      await client.query(`
        CREATE INDEX idx_token_user_id ON token(user_id);
      `);
    }
  } catch (err) {
    console.error('❌ Error creating "token" table:', err.message);
  }
};