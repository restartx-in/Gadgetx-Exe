class JobSheetsService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll(tenantId, filters, db) {
    return await this.repository.getByUserId(db, tenantId, filters);
  }

  async create(user, jobSheetData, db) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const tenantId = user.tenant_id;

      const payload = {
        status: "Pending",
        ...jobSheetData,
      };

      const newJobSheetRaw = await this.repository.create(client, tenantId, payload);
      
      await client.query('COMMIT');

      const fullJobSheetDetails = await this.repository.getById(db, newJobSheetRaw.job_id, tenantId);
      
      return fullJobSheetDetails;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPaginatedByUserId(tenantId, filters, db) {
    const { jobSheets, totalCount } =
      await this.repository.getPaginatedByUserId(db, tenantId, filters);
    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10;
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
    return { data: jobSheets, count: totalCount, page_count };
  }

  async getById(id, tenantId, db) {
    const jobSheet = await this.repository.getById(db, id, tenantId);
    if (!jobSheet) throw new Error("Job sheet not found or not authorized");
    return jobSheet;
  }

  async update(id, user, jobSheetData, db) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const tenantId = user.tenant_id;
      
      const updatedJobSheet = await this.repository.update(
        client,
        id,
        tenantId,
        jobSheetData
      );

      if (!updatedJobSheet) {
        throw new Error("Job sheet not found or not authorized to update");
      }

      await client.query('COMMIT');
      
      return await this.repository.getById(db, updatedJobSheet.job_id, tenantId);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id, user, db) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const tenantId = user.tenant_id;
      const deletedJobSheet = await this.repository.delete(client, id, tenantId);
      if (!deletedJobSheet) {
        throw new Error("Job sheet not found or not authorized to delete");
      }

      await client.query('COMMIT');
      return deletedJobSheet;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
  }
}

module.exports = JobSheetsService;