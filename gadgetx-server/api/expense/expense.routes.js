const express = require("express");
const router = express.Router();
const validateToken = require("../../middlewares/validateToken");

const ExpenseRepository = require("./expense.repository");
const ExpenseService = require("./expense.service");
const ExpenseController = require("./expense.controller");
const ExpenseValidator = require("./expense.validator");

const expenseRepository = new ExpenseRepository();
const expenseService = new ExpenseService(expenseRepository);
const expenseController = new ExpenseController(expenseService);
const expenseValidator = new ExpenseValidator();

router.use(validateToken);

router.get("/paginated", expenseController.getAllPaginated.bind(expenseController));

router.route("/")
  .get(expenseController.getAll.bind(expenseController))
  .post(
    expenseValidator.createValidator.bind(expenseValidator),
    expenseController.create.bind(expenseController)
  );

router.route("/:id")
  .get(expenseController.getById.bind(expenseController))
  .put(
    expenseValidator.updateValidator.bind(expenseValidator),
    expenseController.update.bind(expenseController)
  )
  .delete(expenseController.delete.bind(expenseController));

module.exports = router;