class ModeOfPaymentService {
    constructor(modeOfPaymentRepository) {
        this.modeOfPaymentRepository = modeOfPaymentRepository;
    }

    async getAll(user, filters, db) { // RECEIVE db
        // PASS db
        return await this.modeOfPaymentRepository.getAll(db, user.tenant_id, filters);
    }

    async create(user, modeOfPaymentData, db) { // RECEIVE db
        const dataToSave = { ...modeOfPaymentData, tenant_id: user.tenant_id };
        // PASS db
        const newModeOfPayment = await this.modeOfPaymentRepository.create(db, dataToSave);
        // PASS db (for recursive getById call)
        return this.getById(user, newModeOfPayment.id, db);
    }
    
    async getById(user, id, db) { // RECEIVE db
        // PASS db
        const modeOfPayment = await this.modeOfPaymentRepository.getById(db, id, user.tenant_id);
         if (!modeOfPayment) {
            throw new Error('ModeOfPayment not found');
        }
        return modeOfPayment;
    }

    async update(user, id, modeOfPaymentData, db) { // RECEIVE db
        // PASS db
        const updatedModeOfPayment = await this.modeOfPaymentRepository.update(db, id, user.tenant_id, modeOfPaymentData);
        if (!updatedModeOfPayment) {
            return null;
        }
        // PASS db (for recursive getById call)
        return this.getById(user, id, db);
    }

    async delete(user, id, db) { // RECEIVE db
        // PASS db
        return await this.modeOfPaymentRepository.delete(db, id, user.tenant_id);
    }
}

module.exports = ModeOfPaymentService;