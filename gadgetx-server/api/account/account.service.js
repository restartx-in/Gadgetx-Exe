class AccountService {
  constructor(accountRepository, tenantRepository) {
    this.accountRepository = accountRepository;
    this.tenantRepository = tenantRepository;
  }

  async getAllAccounts(user, filters = {}, db) {
    let tenantId;
    if (user.role === 'super_admin') {
      tenantId = filters.tenant_id || null;
    } else {
      tenantId = user.tenant_id;
    }
    return await this.accountRepository.getAllByTenantId(db, tenantId, filters);
  }

  async create(accountData, user, db) {
    // Get a client from the pool for the transaction
    const client = await db.connect();
    
    try {
      await client.query("BEGIN");

      let tenantIdForNewAccount;
      if (user.role === 'super_admin') {
        if (!accountData.tenant_id) {
          throw new Error("Super admin must specify a 'tenant_id' in the request body.");
        }
        // Pass client to tenantRepo
        const tenantExists = await this.tenantRepository.getById(client, accountData.tenant_id);
        if (!tenantExists) {
            throw new Error(`Tenant with ID ${accountData.tenant_id} not found.`);
        }
        tenantIdForNewAccount = accountData.tenant_id;
      } else {
        tenantIdForNewAccount = user.tenant_id;
      }

      // 1. Create the Account
      const dataToSave = { 
        ...accountData, 
        tenant_id: tenantIdForNewAccount 
      };
      
      // Pass client to accountRepo
      const newAccount = await this.accountRepository.create(client, dataToSave);

      await client.query("COMMIT");

      // Return the full account object with the calculated balance
      return await this.accountRepository.getById(client, newAccount.id, newAccount.tenant_id);

    } catch (error) {
      await client.query("ROLLBACK");
      if (!error.statusCode) error.statusCode = 500; 
      if (error.message.includes("not found")) error.statusCode = 404;
      if (error.message.includes("must specify")) error.statusCode = 400;
      throw error;
    } finally {
      client.release();
    }
  }

  async getById(id, user, db) {
    if (user.role === 'super_admin') {
      return await this.accountRepository.getById(db, id);
    } else {
      return await this.accountRepository.getById(db, id, user.tenant_id);
    }
  }

  async update(id, data, user, db) {
    const { tenant_id, ...updateData } = data;
    if (user.role === 'super_admin') {
      return await this.accountRepository.update(db, id, updateData);
    } else {
      return await this.accountRepository.update(db, id, updateData, user.tenant_id);
    }
  }

  async delete(id, user, db) {
    if (user.role === 'super_admin') {
      return await this.accountRepository.delete(db, id);
    } else {
      return await this.accountRepository.delete(db, id, user.tenant_id);
    }
  }
}

module.exports = AccountService;