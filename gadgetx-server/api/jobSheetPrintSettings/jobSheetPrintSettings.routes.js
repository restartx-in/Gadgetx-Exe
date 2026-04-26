const express = require('express')
const router = express.Router()
// REMOVED: const db = require('../../config/db')
const validateToken = require('../../middlewares/validateToken')
const { upload } = require('../../middlewares/upload')

const JobSheetSettingsRepository = require('./jobSheetPrintSettings.repository')
const JobSheetSettingsService = require('./jobSheetPrintSettings.service')
const JobSheetSettingsController = require('./jobSheetPrintSettings.controller')

// Stateless Instantiation
const repository = new JobSheetSettingsRepository()
const service = new JobSheetSettingsService(repository)
const controller = new JobSheetSettingsController(service)

router.use(validateToken)

router
  .route('/')
  .get(controller.get.bind(controller))
  .put(upload.single('header_image'), controller.update.bind(controller))

module.exports = router