const express = require('express')
const router = express.Router()

const validateToken = require('../../middlewares/validateToken')
const UserRepository = require('../user/user.repository')
const TokenRepository = require('../token/token.repository')
const TokenService = require('../token/token.service')
const AuthService = require('./auth.service')
const AuthController = require('./auth.controller')

const TenantRepository = require('../tenant/tenant.repository')
const RoleRepository = require('../role/role.repository')
const TenantService = require('../tenant/tenant.service')

const {
  registerValidator,
  loginValidator,
  signupValidator,  
  validate,
} = require('./auth.validator')

// --- Dependency Injection (Stateless) ---
const userRepository = new UserRepository()
const tokenRepository = new TokenRepository()
const tenantRepository = new TenantRepository()
const roleRepository = new RoleRepository()

const tenantService = new TenantService(tenantRepository, roleRepository, userRepository)

const tokenService = new TokenService(tokenRepository, userRepository)

const authService = new AuthService(userRepository, tokenService, tenantService)

const authController = new AuthController(authService, tokenService)

// --- Public Routes ---

// Signup Route (Creates Tenant + User)
router.post(
  '/signup',
  signupValidator,  
  validate,
  authController.signup.bind(authController)
)

router.post(
  '/login',
  loginValidator, 
  validate, 
  authController.login.bind(authController)
)

router.post(
  '/register',
  registerValidator, 
  validate, 
  authController.register.bind(authController)
)

// --- Protected Routes ---
router.use(validateToken)

router.post('/logout', authController.logout.bind(authController))
router.post('/refresh', authController.refreshToken.bind(authController))

module.exports = router