
class UserService {
  constructor(repository, tokenService) {
    this.repository = repository;
    this.tokenService = tokenService;
  }

  // ... (createUserByAdmin is unchanged)
  async createUserByAdmin(creatingAdmin, userData, db) {
    const { username, password, role_id } = userData;

    if (!username || !password || !role_id) {
      const error = new Error("Username, password, and role_id are required.");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await this.repository.getByName(db, username);
    if (existingUser) {
      const error = new Error("A user with this username already exists.");
      error.statusCode = 409;
      throw error;
    }

    const tenant_id = creatingAdmin.tenant_id;

    const newUser = {
      username,
      password,
      role_id,
      tenant_id,
    };

    return this.repository.create(db, newUser);
  }

  async getAllUsers(adminUser, db) {
    // This is updated
    return this.repository.getAll(db, adminUser);
  }

  async getPaginatedUsers(filters, adminUser, db) {
    // This is updated - Pass the adminUser and db to the repository
    const { user, totalCount } = await this.repository.getPaginated(
      db,
      filters,
      adminUser
    );
    const pageSize = filters.page_size ? parseInt(filters.page_size, 10) : 10;
    const page_count = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

    return {
      data: user,
      count: totalCount,
      page_count,
    };
  }

  // ... (other methods are unchanged)
  async getById(id, db) {
    const user = await this.repository.getById(db, id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async updateUserProfile(id, { username, currentPassword, newPassword }, db) {
    if (newPassword) {
      if (!currentPassword) {
        const error = new Error(
          "Current password is required to change the password."
        );
        error.statusCode = 400;
        throw error;
      }

      const user = await this.repository.getById(db, id);
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      const isPasswordValid = await this.repository.comparePasswords(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        const error = new Error("Incorrect current password.");
        error.statusCode = 401;
        throw error;
      }
    }

    return this.repository.update(db, id, { username, password: newPassword });
  }

  async updateUserByAdmin(id, data, db) {
    const existingUser = await this.getById(id, db);
    if (!existingUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (existingUser.role_name === "super_admin" && data.role_id) {
      const error = new Error(
        "You cannot modify the Super Admin role assignment."
      );
      error.statusCode = 403;
      throw error;
    }

    return this.repository.updateByAdmin(db, id, data);
  }

  async deleteUser(id, db) {
    const user = await this.getById(id, db);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (user.role_name === "super_admin") {
      const error = new Error("Cannot delete the Super Admin account.");
      error.statusCode = 403;
      throw error;
    }

    await this.tokenService.removeAllRefreshTokensForUser(id, db);
    return this.repository.delete(db, id);
  }
}

module.exports = UserService;