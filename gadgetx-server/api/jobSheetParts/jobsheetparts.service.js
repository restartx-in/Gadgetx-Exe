class JobSheetPartsService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll(tenantId, filters, db) {
    return await this.repository.getAllByTenantId(db, tenantId, filters);
  }

  async create(tenantId, jobSheetPartData, db) {
    const payload = { ...jobSheetPartData, tenant_id: tenantId };
    const newPart = await this.repository.create(db, payload);
    return this.getById(newPart.id, tenantId, db);
  }

  async getPaginatedByTenantId(tenantId, filters, db) {
    const { jobSheetParts, totalCount } =
      await this.repository.getPaginatedByTenantId(db, tenantId, filters);
    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10;
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
    return { data: jobSheetParts, count: totalCount, page_count };
  }

  async getById(id, tenantId, db) {
    const part = await this.repository.getById(db, id, tenantId);
    if (!part) throw new Error("Job sheet part not found or not authorized");
    return part;
  }

  async update(id, tenantId, jobSheetPartData, db) {
    const updatedPart = await this.repository.update(
      db,
      id,
      tenantId,
      jobSheetPartData
    );
    if (!updatedPart) {
      throw new Error("Job sheet part not found or not authorized to update");
    }
    return this.getById(id, tenantId, db);
  }

  async delete(id, tenantId, db) {
    const deletedPart = await this.repository.delete(db, id, tenantId);
    if (!deletedPart) {
      throw new Error("Job sheet part not found or not authorized to delete");
    }
    return deletedPart;
  }
}

module.exports = JobSheetPartsService;