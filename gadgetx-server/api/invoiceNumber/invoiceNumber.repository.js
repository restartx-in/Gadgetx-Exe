class InvoiceNumberRepository {
  
  // Helper: format invoice number with prefix + padded number
  formatInvoiceNumber(type, value) {
    const padded = String(value).padStart(4, '0') // e.g. 10 → 0010
    return `${type.toUpperCase()}-${padded}`
  }

  // 1️⃣ Increment and return next invoice number (SQLite Compatible)
  async generateNext(db, { type, tenantId }) {
    // 1. Check if the record exists
    const check = await db.query(
      `SELECT value FROM invoice_number WHERE tenant_id = $1 AND transaction_type = $2`,
      [tenantId, type]
    );

    let newValue;
    if (check.rows.length > 0) {
      // 2a. Update existing record
      newValue = check.rows[0].value + 1;
      await db.query(
        `UPDATE invoice_number SET value = $1, last_updated = CURRENT_TIMESTAMP 
         WHERE tenant_id = $2 AND transaction_type = $3`,
        [newValue, tenantId, type]
      );
    } else {
      // 2b. Insert new record
      newValue = 1;
      await db.query(
        `INSERT INTO invoice_number (tenant_id, transaction_type, value, last_updated) 
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
        [tenantId, type, newValue]
      );
    }

    return this.formatInvoiceNumber(type, newValue);
  }

  // 2️⃣ Get last used invoice number
  async get(db, { type, tenantId }) {
    const res = await db.query(
      `SELECT value FROM invoice_number 
       WHERE transaction_type = $1 AND tenant_id = $2`, 
       [type, tenantId]
    );

    const value = res.rows[0]?.value || 0;
    return this.formatInvoiceNumber(type, value);
  }

  // 3️⃣ Get all invoice sequences for a tenant
  async getAll(db, tenantId) {
    const res = await db.query(
      `SELECT * FROM invoice_number WHERE tenant_id = $1 ORDER BY transaction_type ASC`,
      [tenantId]
    );
    return res.rows;
  }
}

module.exports = InvoiceNumberRepository;