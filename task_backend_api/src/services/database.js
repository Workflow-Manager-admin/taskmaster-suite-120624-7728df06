const { 
  initializeDatabase, 
  checkDatabaseHealth, 
  closeDatabaseConnection 
} = require('../config/database');
const { getModels } = require('../models');
const { seedDatabase } = require('../seeders');

class DatabaseService {
  constructor() {
    this.models = getModels();
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  // PUBLIC_INTERFACE
  /**
   * Initialize database connection and sync models
   * @param {Object} options - Initialization options
   * @param {boolean} options.runSeeding - Whether to run database seeding
   * @param {boolean} options.force - Force recreate tables
   * @param {boolean} options.alter - Alter tables to match models
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    // Prevent multiple initialization attempts
    if (this.isInitialized) {
      console.log('Database service already initialized.');
      return;
    }
    
    if (this.initializationPromise) {
      console.log('Database initialization in progress, waiting...');
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._performInitialization(options);
    return this.initializationPromise;
  }

  // Private method to perform actual initialization
  async _performInitialization(options = {}) {
    try {
      const { 
        runSeeding = process.env.NODE_ENV === 'development', 
        force = false, 
        alter = process.env.NODE_ENV === 'development' 
      } = options;
      
      console.log('Starting database service initialization...');
      
      // Initialize database and sync models
      await initializeDatabase({ force, alter });
      
      // Load seed data if requested
      if (runSeeding) {
        console.log('Loading seed data...');
        try {
          await seedDatabase();
          console.log('Seed data loaded successfully.');
        } catch (seedError) {
          console.warn('Seed data loading failed (this might be expected):', seedError.message);
          // Don't throw error for seeding failures in production
          if (process.env.NODE_ENV !== 'production') {
            console.error('Seed data error details:', seedError);
          }
        }
      }
      
      this.isInitialized = true;
      console.log('Database service initialized successfully.');
      
    } catch (error) {
      console.error('Failed to initialize database service:', error);
      this.initializationPromise = null; // Allow retry
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
   * Check if database service is initialized
   * @returns {boolean} True if initialized
   */
  isReady() {
    return this.isInitialized;
  }

  // PUBLIC_INTERFACE
  /**
   * Wait for database service to be ready
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForReady(timeout = 30000) {
    const startTime = Date.now();
    
    while (!this.isInitialized && (Date.now() - startTime) < timeout) {
      if (this.initializationPromise) {
        try {
          await this.initializationPromise;
          return;
        } catch (error) {
          // Initialization failed, wait and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (!this.isInitialized) {
      throw new Error('Database service failed to initialize within timeout');
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get database health status
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    try {
      if (!this.isInitialized) {
        return {
          status: 'not_initialized',
          message: 'Database service not initialized',
        };
      }
      
      const healthStatus = await checkDatabaseHealth();
      return {
        ...healthStatus,
        service_status: 'initialized',
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        service_status: this.isInitialized ? 'initialized' : 'not_initialized',
      };
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Reinitialize database service
   * @param {Object} options - Initialization options
   * @returns {Promise<void>}
   */
  async reinitialize(options = {}) {
    console.log('Reinitializing database service...');
    
    // Reset initialization state
    this.isInitialized = false;
    this.initializationPromise = null;
    
    // Reinitialize
    await this.initialize(options);
  }

  // PUBLIC_INTERFACE
  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    try {
      await closeDatabaseConnection();
      this.isInitialized = false;
      this.initializationPromise = null;
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Force run seed data
   * @returns {Promise<void>}
   */
  async runSeedData() {
    try {
      if (!this.isInitialized) {
        throw new Error('Database service not initialized');
      }
      
      console.log('Running seed data...');
      await seedDatabase();
      console.log('Seed data executed successfully.');
    } catch (error) {
      console.error('Error running seed data:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseService();
