// jobsheet.validator.js

class JobSheetsValidator {
  createValidator = (req, res, next) => {
    const requiredFields = [
      'party_id',
      'item_name',
      'issue_reported',
      'service_cost',
      'servicer_id',
      'invoice_number',
      'account_id', // <<< UPDATED
    ]
    const missingFields = requiredFields.filter(
      (field) => req.body[field] === undefined || req.body[field] === null
    )

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
      })
    }
    next()
  }

  updateValidator = (req, res, next) => {
    const requiredFields = [
      'party_id',
      'item_name',
      'issue_reported',
      'status',
      'service_cost',
      'servicer_id',
    ] // <<< UPDATED
    const missingFields = requiredFields.filter(
      (field) => req.body[field] === undefined || req.body[field] === null
    )

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`,
      })
    }
    next()
  }

  idParamValidator = (req, res, next) => {
    const id = req.params.id
    if (!id || isNaN(parseInt(id, 10))) {
      return res.status(400).json({
        error: 'Invalid or missing job sheet ID',
      })
    }
    next()
  }
}

module.exports = JobSheetsValidator
