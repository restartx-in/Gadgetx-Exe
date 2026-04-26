// src/hooks/api/ledger/ledger.service.js
class LedgerService {
  constructor(ledgerRepository) {
    this.ledgerRepository = ledgerRepository
  }

  async create(ledgerData, db) {
    const newLedger = await this.ledgerRepository.create(db, ledgerData)
    if (!newLedger) {
      throw new Error('Failed to create ledger.')
    }
    return this.getById(newLedger.id, newLedger.tenant_id, db)
  }

  async update(id, tenantId, ledgerData, db) {
    const readOnlyFields = [
      'created_at',
      'updated_at',
      'total_count',
      'done_by_name',
      'cost_center_name',
    ]
    readOnlyFields.forEach((field) => delete ledgerData[field])

    const updatedLedger = await this.ledgerRepository.update(
      db, 
      id, 
      tenantId, 
      ledgerData
    )
    if (!updatedLedger) {
      return null
    }
    return this.getById(updatedLedger.id, tenantId, db)
  }

  async delete(id, tenantId, db) {
    const result = await this.ledgerRepository.delete(db, id, tenantId)
    return result
  }

  async getById(id, tenantId, db) {
    return await this.ledgerRepository.getById(db, id, tenantId)
  }

  async adjustBalance(client, ledgerId, tenantId, amount) {
    return await this.ledgerRepository.adjustBalance(client, ledgerId, tenantId, amount);
  }

  async getAll(tenantId, filters, db) {
    return await this.ledgerRepository.getAllByTenantId(db, tenantId, filters)
  }

  async getPaginatedByTenantId(tenantId, filters, db) {
    const { items, totalCount } = await this.ledgerRepository.getPaginatedTenantId(
      db,
      tenantId,
      filters
    )
    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0
    return {
      data: items,
      count: totalCount,
      page_count,
    }
  }

  async getReport(tenantId, filters, db) {
    // ledger_id is now optional
    return await this.ledgerRepository.getReport(db, tenantId, filters);
  }

  async getMonthlyReport(tenantId, filters, db) {
    // ledger_id is now optional
    return await this.ledgerRepository.getMonthlyReport(db, tenantId, filters);
  }
}

module.exports = LedgerService