class AccountController {
  constructor(accountService) {
    this.service = accountService;
  }

  async getAll(req, res, next) {
    try {
      const accounts = await this.service.getAllAccounts(req.user, req.query, req.db);
      res.json(accounts);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const newAccount = await this.service.create(req.body, req.user, req.db);
      res.status(201).json(newAccount);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const account = await this.service.getById(req.params.id, req.user, req.db);
      if (!account) {
        return res
          .status(404)
          .json({ message: "Account not found or not authorized" });
      }
      res.json(account);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await this.service.update(
        req.params.id,
        req.body,
        req.user,
        req.db
      );
      if (!updated) {
        return res
          .status(404)
          .json({ message: "Account not found or not authorized" });
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const deleted = await this.service.delete(req.params.id, req.user, req.db);
      if (!deleted) {
        return res
          .status(404)
          .json({ message: "Account not found or not authorized" });
      }
      res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AccountController;