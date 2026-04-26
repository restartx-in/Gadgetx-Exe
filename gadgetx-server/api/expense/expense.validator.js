class ExpenseValidator {
  createValidator = (req, res, next) => {
    const requiredFields = [
      "description",
      "amount",
      "expense_type_id",
      "amount_paid",
    ];
    
    const amount = parseFloat(req.body.amount);

    const amountPaid = parseFloat(req.body.amount_paid);
    if (isNaN(amountPaid) || amountPaid < 0) {
      return res
        .status(400)
        .json({ error: "Invalid amount paid. Must be a non-negative number." });
    }
    if (amountPaid>0){
        requiredFields.push('account_id')
    }

    if (amountPaid > amount) {
      return res
        .status(400)
        .json({
          error: "Amount paid cannot be greater than the total amount.",
        });
    }

    const missingFields = requiredFields.filter(
      (field) =>
        req.body[field] === undefined ||
        req.body[field] === null ||
        req.body[field] === ""
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res
        .status(400)
        .json({ error: "Invalid amount. Must be a positive number." });
    }

    next();
  };

  updateValidator = (req, res, next) => {
    // For updates, we can be more flexible. If amount is provided, it must be valid.
    if (req.body.amount !== undefined) {
      if (
        isNaN(parseFloat(req.body.amount)) ||
        parseFloat(req.body.amount) <= 0
      ) {
        return res
          .status(400)
          .json({ error: "Invalid amount. Must be a positive number." });
      }
    }
    if (req.body.amount_paid !== undefined) {
      if (
        isNaN(parseFloat(req.body.amount_paid)) ||
        parseFloat(req.body.amount_paid) < 0
      ) {
        return res
          .status(400)
          .json({
            error: "Invalid amount paid. Must be a non-negative number.",
          });
      }
    }
    next();
  };
}

module.exports = ExpenseValidator;
