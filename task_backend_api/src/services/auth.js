const jwt = require('jsonwebtoken');
const { User } = require('../models');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  // PUBLIC_INTERFACE
  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user and token
   */
  async register(userData) {
    const { email, password, first_name, last_name, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user (password will be hashed by model hook)
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      role: role || 'user',
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: user.toSafeJSON(),
      token,
    };
  }

  // PUBLIC_INTERFACE
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and token
   */
  async login(email, password) {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      user: user.toSafeJSON(),
      token,
    };
  }

  // PUBLIC_INTERFACE
  /**
   * Get user by token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} User object
   */
  async getUserByToken(token) {
    const decoded = this.verifyToken(token);
    const user = await User.findByPk(decoded.id);
    
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    return user;
  }
}

module.exports = new AuthService();
