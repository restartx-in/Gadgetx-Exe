class PartnerService {
  constructor(partnerRepository) {
    this.partnerRepository = partnerRepository;
  }

  async getAll(tenantId, filters, db) {
    // Pass db
    return await this.partnerRepository.getAllByTenantId(db, tenantId, filters);
  }

  async create(partnerData, db) {
    // Pass db
    const newPartner = await this.partnerRepository.create(db, partnerData);
    // Pass db to recursive getById
    return this.getById(newPartner.id, partnerData.tenant_id, db);
  }

  async getPaginatedByTenantId(tenantId, filters, db) {
    // Pass db
    const { partners, totalCount } =
      await this.partnerRepository.getPaginatedByTenantId(db, tenantId, filters);

    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10;
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

    return {
      data: partners,
      count: totalCount,
      page_count,
    };
  }

  async getById(id, tenantId, db) {
    // Pass db
    const partner = await this.partnerRepository.getById(db, id, tenantId);
    if (!partner) {
      throw new Error("Partner not found or not authorized");
    }
    return partner;
  }

  async update(id, tenantId, partnerData, db) {
    // Pass db
    const updatedPartner = await this.partnerRepository.update(
      db,
      id,
      tenantId,
      partnerData
    );
    if (!updatedPartner) {
      return null;
    }
    // Pass db
    return this.getById(id, tenantId, db);
  }

  async delete(id, tenantId, db) {
    // Pass db
    return await this.partnerRepository.delete(db, id, tenantId);
  }
}

module.exports = PartnerService;