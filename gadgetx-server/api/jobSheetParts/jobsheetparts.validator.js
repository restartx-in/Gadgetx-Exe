class JobSheetPartsValidator {
    createValidator = (req, res, next) => {
        const requiredFields = ['job_id', 'item_id', 'quantity'];
        const missingFields = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === null);

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`,
            });
        }
        next();
    };

    updateValidator = (req, res, next) => {
        const requiredFields = ['job_id', 'item_id', 'quantity'];
        const missingFields = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === null);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}`,
            });
        }
        next();
    };

    idParamValidator = (req, res, next) => {
        const id = req.params.id;
        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({
                error: 'Invalid or missing job sheet part ID',
            });
        }
        next();
    };
}

module.exports = JobSheetPartsValidator;