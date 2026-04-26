class BrandService {
    constructor(brandRepository, tenantRepository) {
        this.brandRepository = brandRepository;
        this.tenantRepository = tenantRepository;
    }

    async getAll(user, filters = {}, db) {
        let tenantId;
        if (user.role === 'super_admin') {
            tenantId = filters.tenant_id || null; 
        } else {
            tenantId = user.tenant_id;
        }
        // Pass db to repo
        return await this.brandRepository.getAllByTenantId(db, tenantId, filters);
    }

    async create(brandData, user, db) {
        let tenantIdForNewEntry;
        if (user.role === 'super_admin') {
            if (!brandData.tenant_id) {
                const error = new Error("Super admin must specify a 'tenant_id' in the request body.");
                error.statusCode = 400;
                throw error;
            }
            // Pass db to tenantRepo
            const tenantExists = await this.tenantRepository.getById(db, brandData.tenant_id);
            if (!tenantExists) {
                const error = new Error(`Tenant with ID ${brandData.tenant_id} not found.`);
                error.statusCode = 404;
                throw error;
            }
            tenantIdForNewEntry = brandData.tenant_id;
        } else {
            tenantIdForNewEntry = user.tenant_id;
        }

        const dataToSave = { ...brandData, tenant_id: tenantIdForNewEntry };
        // Pass db to repo
        return await this.brandRepository.create(db, dataToSave);
    }

    async getById(id, user, db) {
        const tenantId = user.role === 'super_admin' ? null : user.tenant_id;
        // Pass db to repo
        return await this.brandRepository.getById(db, id, tenantId);
    }

    async update(id, brandData, user, db) {
        const { tenant_id, ...updateData } = brandData;
        const tenantIdToUpdate = user.role === 'super_admin' ? null : user.tenant_id;

        // Pass db to repo
        const updatedBrand = await this.brandRepository.update(db, id, tenantIdToUpdate, updateData);
        if (!updatedBrand) {
            throw new Error("Brand not found or not authorized to update");
        }
        // Pass db to self call
        return this.getById(id, user, db);
    }

    async delete(id, user, db) {
        const tenantIdToDelete = user.role === 'super_admin' ? null : user.tenant_id;
        // Pass db to repo
        return await this.brandRepository.delete(db, id, tenantIdToDelete);
    }
}

module.exports = BrandService;