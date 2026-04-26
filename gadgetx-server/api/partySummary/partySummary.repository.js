class PartySummaryRepository {

  async getVoucherPaymentsInPeriod(
    db,
    tenant_id,
    party_id,
    startDate,
    endDateExclusive,
    partyType
  ) {

    const ledgerColumn =
      partyType === "customer" ? "from_ledger_id" : "to_ledger_id";
    const voucherType = partyType === "customer" ? 1 : 0;

    const query = `
      SELECT COALESCE(SUM(v.amount), 0) AS total
      FROM voucher v
      JOIN account a ON v.${ledgerColumn} = a.id
      WHERE a.party_id = $1
        AND v.tenant_id IS NOT DISTINCT FROM $2
        AND v.voucher_type = $3
        AND v.date >= $4::date
        AND ($5::timestamp IS NULL OR v.date <= $5::timestamp)
    `;

    const result = await db.query(query, [
      party_id,
      tenant_id,
      voucherType,
      startDate,
      endDateExclusive,
    ]);
    return parseFloat(result.rows[0].total);
  }

  async getCumulativeVoucherPaymentsBefore(
    db,
    tenant_id,
    party_id,
    beforeDate,
    partyType
  ) {
    const ledgerColumn =
      partyType === "customer" ? "from_ledger_id" : "to_ledger_id";
    const voucherType = partyType === "customer" ? 1 : 0;

    const query = `
      SELECT COALESCE(SUM(v.amount), 0) AS total
      FROM voucher v
      JOIN account a ON v.${ledgerColumn} = a.id
      WHERE a.party_id = $1
        AND v.tenant_id IS NOT DISTINCT FROM $2
        AND v.voucher_type = $3
        AND v.date < $4::date
    `;

    const result = await db.query(query, [
      party_id,
      tenant_id,
      voucherType,
      beforeDate,
    ]);
    return parseFloat(result.rows[0].total);
  }

  // --- EXISTING METHODS (Sales/Purchases/Parties) ---

  async getAllParties(db, tenant_id) {
    const result = await db.query(
      `SELECT id, name, type FROM party WHERE tenant_id IS NOT DISTINCT FROM $1 ORDER BY name`,
      [tenant_id]
    );
    return result.rows;
  }

  async getSalesInPeriod(db, tenant_id, party_id, startDate, endDateExclusive) {
    const result = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales
       WHERE party_id = $1 AND tenant_id IS NOT DISTINCT FROM $2
       AND date >= $3::date AND ($4::timestamp IS NULL OR date <= $4::timestamp)`,
      [party_id, tenant_id, startDate, endDateExclusive]
    );
    return parseFloat(result.rows[0].total);
  }

  async getPurchasesInPeriod(
    db,
    tenant_id,
    party_id,
    startDate,
    endDateExclusive
  ) {
    const result = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total FROM purchase
       WHERE party_id = $1 AND tenant_id IS NOT DISTINCT FROM $2
       AND date >= $3::date AND ($4::timestamp IS NULL OR date <= $4::timestamp)`,
      [party_id, tenant_id, startDate, endDateExclusive]
    );
    return parseFloat(result.rows[0].total);
  }

  async getCumulativeSalesBefore(db, tenant_id, party_id, beforeDate) {
    const result = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales
       WHERE party_id = $1 AND tenant_id IS NOT DISTINCT FROM $2 AND date < $3::date`,
      [party_id, tenant_id, beforeDate]
    );
    return parseFloat(result.rows[0].total);
  }

  async getCumulativePurchasesBefore(db, tenant_id, party_id, beforeDate) {
    const result = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total FROM purchase
       WHERE party_id = $1 AND tenant_id IS NOT DISTINCT FROM $2 AND date < $3::date`,
      [party_id, tenant_id, beforeDate]
    );
    return parseFloat(result.rows[0].total);
  }
}

module.exports = PartySummaryRepository;
