const { initializeDatabase } = require('../config/database');
const { getModels } = require('../models');
const { seedDatabase } = require('../seeders');

class DatabaseService {
  constructor() {
    this.models = getModels();
  }

  // PUBLIC_INTERFACE
  /**
   * Initialize database connection and sync models
   * @param {boolean} runSeeding - Whether to run database seeding
   * @returns {Promise<void>}
   */
  async initialize(runSeeding = false) {
    try {
      await initializeDatabase();
      
      if (runSeeding && process.env.NODE_ENV === 'development') {
        await seedDatabase();
      }
      
      console.log('Database service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get all available models
   * @returns {object} Object containing all models
   */
  getModels() {
    return this.models;
  }

  // PUBLIC_INTERFACE
  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    try {
      const { sequelize } = require('../config/database');
      await sequelize.close();
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();
