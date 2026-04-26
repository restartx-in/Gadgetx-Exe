const express = require('express')
const router = express.Router()
const validateToken = require('../../middlewares/validateToken')
// const db = require('../../config/db') // No longer needed

const JobSheetPartsRepository = require('./jobsheetparts.repository')
const JobSheetPartsService = require('./jobsheetparts.service')
const JobSheetPartsController = require('./jobsheetparts.controller')
const JobSheetPartsValidator = require('./jobsheetparts.validator')

const repository = new JobSheetPartsRepository()
const service = new JobSheetPartsService(repository)
const controller = new JobSheetPartsController(service)
const validator = new JobSheetPartsValidator()

router.use(validateToken)

router.get('/paginated', controller.getAllPaginated.bind(controller))

router
  .route('/')
  .get(controller.getAll.bind(controller))
  .post(
    validator.createValidator.bind(validator),
    controller.create.bind(controller)
  )

router
  .route('/:id')
  .get(
    validator.idParamValidator.bind(validator),
    controller.getById.bind(controller)
  )
  .put(
    validator.updateValidator.bind(validator),
    controller.update.bind(controller)
  )
  .delete(controller.delete.bind(controller))

module.exports = router