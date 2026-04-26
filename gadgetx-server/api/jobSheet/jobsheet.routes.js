const express = require('express')
const router = express.Router()
const validateToken = require('../../middlewares/validateToken')
// const db = require('../../config/db'); // No longer needed

const JobSheetsRepository = require('./jobsheet.repository')
const JobSheetsService = require('./jobsheet.service')
const JobSheetsController = require('./jobsheet.controller')
const JobSheetsValidator = require('./jobsheet.validators')

const jobSheetsRepository = new JobSheetsRepository()
const jobSheetsService = new JobSheetsService(
  jobSheetsRepository,
)
const jobSheetsController = new JobSheetsController(jobSheetsService)
const jobSheetsValidator = new JobSheetsValidator()

router.use(validateToken)

router.get(
  '/paginated',
  jobSheetsController.getAllPaginated.bind(jobSheetsController)
)

router
  .route('/')
  .get(jobSheetsController.getAll.bind(jobSheetsController))
  .post(
    jobSheetsValidator.createValidator.bind(jobSheetsValidator),
    jobSheetsController.create.bind(jobSheetsController)
  )

router
  .route('/:id')
  .get(
    jobSheetsValidator.idParamValidator.bind(jobSheetsValidator),
    jobSheetsController.getById.bind(jobSheetsController)
  )
  .put(
    jobSheetsValidator.updateValidator.bind(jobSheetsValidator),
    jobSheetsController.update.bind(jobSheetsController)
  )
  .delete(jobSheetsController.delete.bind(jobSheetsController))

module.exports = router