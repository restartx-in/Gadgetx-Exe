const { body, validationResult } = require("express-validator");

const registerValidator = [
  body("username").trim().notEmpty().withMessage("Username is required."),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long."),
  body("tenant_id").optional().isInt(),
  body("role_id").optional().isInt(),
];


const loginValidator = [
  body("username").notEmpty().withMessage("Username is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

const signupValidator = [
  // Tenant Fields
  body("name").trim().notEmpty().withMessage("Company/Tenant name is required."),
  body("type")
    .trim()
    .isIn(['vehicle', 'restaurant', 'fitness', 'garage', 'gadget'])
    .withMessage("Invalid type. Allowed: vehicle, restaurant, fitness, garage, gadget"),
  body("plan").trim().notEmpty().withMessage("Plan is required."),
  
  // User Fields
  body("username").trim().notEmpty().withMessage("Username is required."),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long."),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  registerValidator,
  loginValidator,
  signupValidator,
  validate,
};
