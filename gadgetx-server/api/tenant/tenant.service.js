class TenantService {
  constructor(tenantRepository, roleRepository, userRepository) {
    this.tenantRepository = tenantRepository
    this.roleRepository = roleRepository // Injected RoleRepository
    this.userRepository = userRepository // Injected RoleRepository
  }

  async create(tenantData, db) {
    const tenant = await this.tenantRepository.create(db, tenantData)
    const role = await this.createAdminRuleForTenant(tenant.id, db)
    const { username, password } = tenantData
    const user = await this.userRepository.create(db, {
      username,
      password,
      tenant_id: tenant.id,
      role_id: role.id,
    })
    return tenant
  }

  async createAdminRuleForTenant(tenant_id, db) {
    const roleData = { name: 'admin', tenant_id, permissions: {} }
    return await this.roleRepository.create(db, roleData)
  }

  async getAll(filters, db) {
    return await this.tenantRepository.getAll(db, filters)
  }

  async getById(id, db) {
    const tenant = await this.tenantRepository.getById(db, id)
    if (!tenant) {
      throw new Error('Tenant not found')
    }
    return tenant
  }

  async update(id, tenantData, db) {
    await this.getById(id, db)
    const updatedTenant = await this.tenantRepository.update(db, id, tenantData)
    return updatedTenant
  }

  async delete(id, db) {
    return await this.tenantRepository.delete(db, id)
  }
}

module.exports = TenantService