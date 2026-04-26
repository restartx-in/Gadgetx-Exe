class JobSheetPartsController {
  constructor(service) {
    this.service = service;
  }

  async getAll(req, res, next) {
    try {
      const data = await this.service.getAll(req.user.tenant_id, req.query, req.db);
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async getAllPaginated(req, res, next) {
    try {
      const data = await this.service.getPaginatedByTenantId(
        req.user.tenant_id,
        req.query,
        req.db
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const part = await this.service.getById(
        req.params.id,
        req.user.tenant_id,
        req.db
      );
      res.json(part);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const newPart = await this.service.create(req.user.tenant_id, req.body, req.db);
      res.status(201).json(newPart);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updatedPart = await this.service.update(
        req.params.id,
        req.user.tenant_id,
        req.body,
        req.db
      );
      res.json(updatedPart);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await this.service.delete(req.params.id, req.user.tenant_id, req.db);
      res.status(200).json({ message: "Job sheet part removed successfully" });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = JobSheetPartsController;