const { User } = require('../models');

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
}

module.exports = new UserController();
