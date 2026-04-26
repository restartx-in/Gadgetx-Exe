class ExpenseTypeController {
  constructor(expenseTypeService) {
    this.service = expenseTypeService;
  }

  async create(req, res, next) {
    try {
      const expenseTypeData = {
        ...req.body,
        tenant_id: req.user.tenant_id,
      };
      // Pass req.db
      const newExpenseType = await this.service.create(expenseTypeData, req.db);
      res.status(201).json(newExpenseType);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      // Pass req.db
      const data = await this.service.getAll(req.user.tenant_id, req.db);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      // Pass req.db
      const expenseType = await this.service.getById(
        req.params.id,
        req.user.tenant_id,
        req.db
      );
      if (!expenseType) {
        return res
          .status(404)
          .json({ message: "Expense Type not found or not authorized" });
      }
      res.json(expenseType);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      // Pass req.db
      const updatedExpenseType = await this.service.update(
        req.params.id,
        req.user.tenant_id,
        req.body,
        req.db
      );
      if (!updatedExpenseType) {
        return res
          .status(404)
          .json({
            message: "Expense Type not found or not authorized to update",
          });
      }
      res.json(updatedExpenseType);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      // Pass req.db
      const result = await this.service.delete(req.params.id, req.user.tenant_id, req.db);
      if (!result) {
        return res
          .status(404)
          .json({
            message: "Expense Type not found or not authorized to delete",
          });
      }
      res.status(200).json({ message: "Expense Type deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ExpenseTypeController;