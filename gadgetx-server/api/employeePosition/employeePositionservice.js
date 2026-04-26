class EmployeePositionService {
  constructor(employeePositionRepository, tenantRepository) { 
    this.employeePositionRepository = employeePositionRepository;
    this.tenantRepository = tenantRepository;
  }

  async getAll(user, filters = {}, db) { 
    let tenantId;
    if (user.role === 'super_admin') {
      tenantId = filters.tenant_id || null;
      if (!tenantId) {
        const error = new Error("Bad Request: Super admin must specify a 'tenant_id' in the query parameters.");
        error.statusCode = 400;
        throw error;
      }
    } else {
      tenantId = user.tenant_id;
    }
    // Pass db
    return await this.employeePositionRepository.getAllByTenantId(db, tenantId, filters);
  }

  async create(data, user, db) { 
    let tenantIdForNewEntry;
    if (user.role === 'super_admin') {
      if (!data.tenant_id) {
        const error = new Error("Super admin must specify a 'tenant_id' in the request body.");
        error.statusCode = 400;
        throw error;
      }
      // Pass db
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
    // Pass db
    return await this.employeePositionRepository.create(db, dataToSave);
  }

  async getById(id, user, db) { 
    const tenantId = user.role === 'super_admin' ? null : user.tenant_id;
    // Pass db
    return await this.employeePositionRepository.getById(db, id, tenantId);
  }

  async update(id, data, user, db) { 
    const { tenant_id, ...updateData } = data;
    const tenantIdToUpdate = user.role === 'super_admin' ? null : user.tenant_id;
    // Pass db
    const updatedPosition = await this.employeePositionRepository.update(db, id, tenantIdToUpdate, updateData);
    if (!updatedPosition) {
        throw new Error("Employee Position not found or not authorized to update");
    }
    // Pass db
    return this.getById(id, user, db);
  }

  async delete(id, user, db) { 
    const tenantIdToDelete = user.role === 'super_admin' ? null : user.tenant_id;
    // Pass db
    return await this.employeePositionRepository.delete(db, id, tenantIdToDelete);
  }
}

module.exports = EmployeePositionService;