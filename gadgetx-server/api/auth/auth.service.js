class AuthService {
  constructor(userRepository, tokenService, tenantService) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.tenantService = tenantService; 
  }

  // ADDED: db param
  async registerUser({ username, password, tenant_id, role_id }, db) {
    if (!username || !password) {
      const error = new Error("Username and password are required");
      error.statusCode = 400;
      throw error;
    }

    // Pass db to repo
    const existingUser = await this.userRepository.getByName(db, username);
    if (existingUser) {
      const error = new Error("Username already exists");
      error.statusCode = 409;
      throw error;
    }

    // Pass db to repo
    return this.userRepository.create(db, {
      username,
      password,
      tenant_id: tenant_id || null,
      role_id: role_id || null,
    });
  }

  // ADDED: db param
  async signup(data, db) {
    // Pass db to repo
    const existingUser = await this.userRepository.getByName(db, data.username);
    if (existingUser) {
      const error = new Error("Username already exists");
      error.statusCode = 409;
      throw error;
    }

    // Pass db to tenantService
    const newTenant = await this.tenantService.create(data, db);
    
    return {
      message: "Tenant and Admin User created successfully",
      tenant: newTenant,
      username: data.username 
    };
  }

  // ADDED: db param
  async login({ username, password }, db) {
    if (!username || !password) {
      const error = new Error("Username and password are required");
      error.statusCode = 400;
      throw error;
    }

    // Pass db to repo
    const user = await this.userRepository.getByName(db, username);
    if (!user || !user.active) {
      const error = new Error("Invalid credentials or inactive user");
      error.statusCode = 401;
      throw error;
    }

    // No db needed for comparePasswords usually
    const isMatch = await this.userRepository.comparePasswords(
      password,
      user.password
    );
    if (!isMatch) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      throw error;
    }

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    // Pass db to tokenService
    await this.tokenService.removeAllRefreshTokensForUser(user.id, db);
    await this.tokenService.saveRefreshToken(user, refreshToken, db);

    return { accessToken, refreshToken, user };
  }
}

module.exports = AuthService;