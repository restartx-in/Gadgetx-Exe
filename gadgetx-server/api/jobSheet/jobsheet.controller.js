class JobSheetsController {
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
            const data = await this.service.getPaginatedByUserId(req.user.tenant_id, req.query, req.db);
            res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async getById(req, res, next) {
        try {
            const jobSheet = await this.service.getById(req.params.id, req.user.tenant_id, req.db);
            res.json(jobSheet);
        } catch (error) {
            next(error);
        }
    }

    async create(req, res, next) {
        try {
            const newJobSheet = await this.service.create(req.user, req.body, req.db);
            res.status(201).json(newJobSheet);
        } catch (error) {
            next(error);
        }
    }

    async update(req, res, next) {
        try {
            const updatedJobSheet = await this.service.update(req.params.id, req.user, req.body, req.db);
            res.json(updatedJobSheet);
        } catch (error) {
            next(error);
        }
    }

    async delete(req, res, next) {
        try {
            await this.service.delete(req.params.id, req.user, req.db);
            res.status(200).json({ message: 'Job sheet removed successfully' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = JobSheetsController;