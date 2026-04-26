class PartyService {
    constructor(partyRepository, ledgerService) { // MODIFIED: Added ledgerService
        this.partyRepository = partyRepository;
        this.ledgerService = ledgerService;
    }

    // ADDED: db param
    async getAll(user, filters, db) {
        // Pass db to repo
        return await this.partyRepository.getByTenantId(db, user.tenant_id, filters);
    }

    // ADDED: db param
    async getPaginatedByTenantId(user, filters, db) { 
        // Pass db to repo
        const { parties, totalCount } = await this.partyRepository.getPaginatedByTenantId(db, user.tenant_id, filters); 
        
        const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10;
        const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
        
        return {
            data: parties,
            count: totalCount,
            page_count,
        };
    }

    async create(partyData, user, db) {

    const ledgerName = `${partyData.name} - ${partyData.type.toUpperCase()}`;

    const ledgerData = {
        tenant_id: user.tenant_id,
        name: ledgerName,
        balance: 0.00,
        done_by_id: partyData.done_by_id,
        cost_center_id: partyData.cost_center_id,
    };

    const newLedger = await this.ledgerService.create(ledgerData, db);

    const dataToSave = {
        ...partyData,
        tenant_id: user.tenant_id,
        ledger_id: newLedger.id, 
    };

    const newParty = await this.partyRepository.create(db, dataToSave);

    return newParty;
}

    
    // ADDED: db param
    async getById(id, tenantId, db) { 
        // Pass db to repo
        const party = await this.partyRepository.getById(db, id, tenantId);
         if (!party) {
            throw new Error('Party not found or user not authorized');
        }
        return party;
    }

    // ADDED: db param
    async update(id, user, partyData, db) { 
        // Pass db to repo
        const updatedParty = await this.partyRepository.update(db, id, user.tenant_id, partyData); 
        if (!updatedParty) {
            return null;
        }
        // Pass db to self
        return this.getById(id, user.tenant_id, db); 
    }

    // ADDED: db param
    async delete(id, user, db) { 
        // Pass db to repo
        return await this.partyRepository.delete(db, id, user.tenant_id); 
    }
}

module.exports = PartyService;