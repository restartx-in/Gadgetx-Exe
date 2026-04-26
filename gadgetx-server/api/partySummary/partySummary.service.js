const PartySummaryRepository = require("./partySummary.repository");

class PartySummaryService {
  constructor(repository = new PartySummaryRepository()) {
    this.repository = repository;
  }

  async generateSummary(db, tenant_id, filters) {
    const { start_date, end_date } = filters;
    const startDate = start_date || "1900-01-01";
    const endDateExclusive = end_date ? `${end_date} 23:59:59.999` : null;

    const parties = await this.repository.getAllParties(db, tenant_id);
    if (parties.length === 0) return [];

    const summaries = [];

    for (const party of parties) {
      const { id: partyId, name: partyName, type: partyType } = party;

      // 1. Period Values
      const sales = await this.repository.getSalesInPeriod(
        db,
        tenant_id,
        partyId,
        startDate,
        endDateExclusive
      );
      const purchases = await this.repository.getPurchasesInPeriod(
        db,
        tenant_id,
        partyId,
        startDate,
        endDateExclusive
      );

      // Fetch payments from Voucher table
      const payments = await this.repository.getVoucherPaymentsInPeriod(
        db,
        tenant_id,
        partyId,
        startDate,
        endDateExclusive,
        partyType
      );

      // 2. Cumulative values before start_date for Opening Balance
      const oldSales = await this.repository.getCumulativeSalesBefore(
        db,
        tenant_id,
        partyId,
        startDate
      );
      const oldPurchases = await this.repository.getCumulativePurchasesBefore(
        db,
        tenant_id,
        partyId,
        startDate
      );
      const oldPayments =
        await this.repository.getCumulativeVoucherPaymentsBefore(
          db,
          tenant_id,
          partyId,
          startDate,
          partyType
        );

      // 3. Calculation Logic
      let opening_balance = 0;
      let closing_balance = 0;

      if (partyType === "customer") {
        // Customer: Sales increase debt, Payments decrease debt
        opening_balance = oldSales - oldPayments;
        closing_balance = opening_balance + (sales - payments);
      } else {
        // Vendor: Purchases increase what we owe, Payments decrease it
        opening_balance = oldPurchases - oldPayments;
        closing_balance = opening_balance + (purchases - payments);
      }

      summaries.push({
        party_id: partyId,
        party_name: partyName,
        party_type: partyType,
        sales: parseFloat(sales.toFixed(2)),
        purchases: parseFloat(purchases.toFixed(2)),
        payments: parseFloat(payments.toFixed(2)),
        opening_balance: parseFloat(opening_balance.toFixed(2)),
        closing_balance: parseFloat(closing_balance.toFixed(2)),
      });
    }

    return summaries;
  }

  // Note: Updated to fetch from Voucher details if needed,
  // though the generic summary is usually the priority.
  async getPartyPaymentDetails(db, tenant_id, party_id, filters = {}) {
    // Implementation would follow similar logic to generateSummary
    // but returning the list of individual voucher rows for that party.
    // ...
  }
}

module.exports = PartySummaryService;
