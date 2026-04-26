class ExpenseService {
  constructor(expenseRepository) {
    this.expenseRepository = expenseRepository;
  }

  async getAll(tenantId, filters, db) {
    return await this.expenseRepository.getAllByTenantId(db, tenantId, filters);
  }

  async create(expenseData, user, db) {
    try {
      await db.query("BEGIN");
      const newExpense = await this.expenseRepository.create(db, expenseData);
      await db.query("COMMIT");
      return this.getById(newExpense.id, newExpense.tenant_id, db);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }

  async getPaginatedByTenantId(tenantId, filters, db) {
    const { expenses, totalCount, total_amount, total_amount_paid } =
      await this.expenseRepository.getPaginatedByTenantId(db, tenantId, filters);

    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10;
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

    return {
      data: expenses,
      count: totalCount,
      page_count,
      total_amount: parseFloat(total_amount || 0),
      total_amount_paid: parseFloat(total_amount_paid || 0),
    };
  }

  async getById(id, tenantId, db) {
    const expense = await this.expenseRepository.getById(db, id, tenantId);
    if (!expense) throw new Error("Expense not found or not authorized");
    return expense;
  }

  async update(id, tenantId, expenseData, db) {
    try {
      await db.query("BEGIN");
      await this.expenseRepository.update(db, id, tenantId, expenseData);
      await db.query("COMMIT");
      return this.getById(id, tenantId, db);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }

  async delete(id, tenantId, db) {
    try {
      await db.query("BEGIN");
      const result = await this.expenseRepository.delete(db, id, tenantId);
      await db.query("COMMIT");
      return result;
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }
}

module.exports = ExpenseService;