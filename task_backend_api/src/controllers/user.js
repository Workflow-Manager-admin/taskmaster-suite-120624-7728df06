const { User } = require('../models');
const authService = require('../services/auth');

class UserController {
  // PUBLIC_INTERFACE
  /**
   * Get all users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getAllUsers(req, res) {
    try {
      const users = await User.findAll({
        attributes: { exclude: ['password'] }
      });
      res.status(200).json({
        status: 'success',
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch users'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [{
          model: require('../models').Task,
          as: 'tasks'
        }]
      });

      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch user'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Create a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async createUser(req, res) {
    try {
      const { email, password, first_name, last_name, role } = req.body;
      
      const user = await User.create({
        email,
        password,
        first_name,
        last_name,
        role: role || 'user'
      });

      res.status(201).json({
        status: 'success',
        data: user.toSafeJSON()
      });
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          status: 'error',
          message: 'Email already exists'
        });
      }
      res.status(500).json({
        status: 'error',
        message: 'Failed to create user'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async register(req, res) {
    try {
      const { email, password, first_name, last_name, role } = req.body;

      // Basic validation
      if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({
          status: 'error',
          message: 'Email, password, first name, and last name are required'
        });
      }

      const result = await authService.register({
        email,
        password,
        first_name,
        last_name,
        role
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      console.error('Error registering user:', error);
      
      if (error.message === 'User already exists') {
        return res.status(409).json({
          status: 'error',
          message: error.message
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to register user'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
      }

      const result = await authService.login(email, password);

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      
      if (error.message === 'Invalid credentials' || error.message === 'Account is deactivated') {
        return res.status(401).json({
          status: 'error',
          message: error.message
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to login'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getProfile(req, res) {
    try {
      res.status(200).json({
        status: 'success',
        data: req.user.toSafeJSON()
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get user profile'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async updateProfile(req, res) {
    try {
      const { first_name, last_name, email } = req.body;
      const user = req.user;

      // Update allowed fields
      if (first_name) user.first_name = first_name;
      if (last_name) user.last_name = last_name;
      if (email) user.email = email;

      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: user.toSafeJSON()
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          status: 'error',
          message: 'Email already exists'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Failed to update profile'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password and new password are required'
        });
      }

      // Verify current password
      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      // Update password (will be hashed by model hook)
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to change password'
      });
    }
  }
}

module.exports = new UserController();
