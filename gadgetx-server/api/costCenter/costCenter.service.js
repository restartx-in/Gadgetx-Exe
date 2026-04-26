class CostCenterService {
  constructor(costCenterRepository, tenantRepository) {
    this.costCenterRepository = costCenterRepository;
    this.tenantRepository = tenantRepository;
  }

  async getAll(user, query = {}, db) {
    if (user.role === 'super_admin') {
      const { tenant_id } = query;
      if (!tenant_id) {
        const error = new Error("Bad Request: Super admin must specify a 'tenant_id' in the query parameters.");
        error.statusCode = 400;
        throw error;
      }
      return await this.costCenterRepository.getAllByTenantId(db, tenant_id);
    } else {
      return await this.costCenterRepository.getAllByTenantId(db, user.tenant_id);
    }
  }

  async create(data, user, db) {
    let tenantIdForNewEntry;
    if (user.role === 'super_admin') {
      if (!data.tenant_id) {
        const error = new Error("Super admin must specify a 'tenant_id' in the request body.");
        error.statusCode = 400;
        throw error;
      }
      // Pass db to tenantRepository
      const tenantExists = await this.tenantRepository.getById(db, data.tenant_id);
      if (!tenantExists) {
          const error = new Error(`Tenant with ID ${data.tenant_id} not found.`);
          error.statusCode = 404;
          throw error;
      }
      tenantIdForNewEntry = data.tenant_id;
    } else {
      tenantIdForNewEntry = user.tenant_id;
    }
    const dataToSave = { ...data, tenant_id: tenantIdForNewEntry };
    return await this.costCenterRepository.create(db, dataToSave);
  }

  async getById(id, user, db) {
    const tenantId = user.role === 'super_admin' ? null : user.tenant_id;
    return await this.costCenterRepository.getById(db, id, tenantId);
  }

  async update(id, data, user, db) {
    const { tenant_id, ...updateData } = data; // Prevent changing tenant_id
    const tenantIdToUpdate = user.role === 'super_admin' ? null : user.tenant_id;
    return await this.costCenterRepository.update(db, id, tenantIdToUpdate, updateData);
  }

  async delete(id, user, db) {
    const tenantIdToDelete = user.role === 'super_admin' ? null : user.tenant_id;
    return await this.costCenterRepository.delete(db, id, tenantIdToDelete);
  }
}

module.exports = CostCenterService;