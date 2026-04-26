class ExpenseTypeService {
  constructor(expenseTypeRepository) {
    this.expenseTypeRepository = expenseTypeRepository;
  }

  async getAll(tenantId, db) {
    // Pass db
    return await this.expenseTypeRepository.getAllByUserId(db, tenantId);
  }

  async create(expenseTypeData, db) {
    // Pass db
    return await this.expenseTypeRepository.create(db, expenseTypeData);
  }

  async getById(id, tenantId, db) {
    // Pass db
    return await this.expenseTypeRepository.getById(db, id, tenantId);
  }

  async update(id, tenantId, expenseTypeData, db) {
    // Pass db
    return await this.expenseTypeRepository.update(
      db,
      id,
      tenantId,
      expenseTypeData
    );
  }

  async delete(id, tenantId, db) {
    // Pass db
    return await this.expenseTypeRepository.delete(db, id, tenantId);
  }
}

module.exports = ExpenseTypeService;