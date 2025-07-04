const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    match: [
      /SQLITE_BUSY/,
      /SQLITE_LOCKED/,
      /database is locked/,
      /database table is locked/,
    ],
    max: 3,
  },
});

// PUBLIC_INTERFACE
/**
 * Test database connection with retry logic
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<void>}
 */
async function testConnection(retries = 3) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      return;
    } catch (error) {
      lastError = error;
      console.warn(`Database connection attempt ${i + 1} failed:`, error.message);
      
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('Unable to connect to the database after multiple attempts:', lastError);
  throw lastError;
}

// PUBLIC_INTERFACE
/**
 * Initialize database and sync models with migration support
 * @param {Object} options - Initialization options
 * @param {boolean} options.force - Force recreate tables
 * @param {boolean} options.alter - Alter tables to match models
 * @returns {Promise<void>}
 */
async function initializeDatabase(options = {}) {
  try {
    const { force = false, alter = false } = options;
    
    console.log('Initializing database...');
    
    // Test connection first
    await testConnection();
    
    // Create database directory if it doesn't exist
    const dbPath = path.dirname(path.join(__dirname, '../../database.sqlite'));
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }
    
    // Sync models with database
    const syncOptions = {
      force,
      alter: process.env.NODE_ENV === 'development' ? alter : false,
    };
    
    console.log('Synchronizing database models...');
    await sequelize.sync(syncOptions);
    
    if (force) {
      console.log('Database tables recreated successfully.');
    } else if (alter) {
      console.log('Database tables altered to match models.');
    } else {
      console.log('Database synchronized successfully.');
    }
    
    // Run any pending migrations if in production
    if (process.env.NODE_ENV === 'production') {
      await runMigrations();
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// PUBLIC_INTERFACE
/**
 * Run database migrations
 * @returns {Promise<void>}
 */
async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    
    const executedNames = executedMigrations.map(m => m.name);
    
    // Define available migrations
    const availableMigrations = [
      // Add future migrations here
    ];
    
    // Run pending migrations
    const pendingMigrations = availableMigrations.filter(
      migration => !executedNames.includes(migration.name)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations to run.');
      return;
    }
    
    for (const migration of pendingMigrations) {
      console.log(`Running migration: ${migration.name}`);
      await migration.up(sequelize.getQueryInterface(), sequelize);
      
      // Record migration execution
      await sequelize.query(
        'INSERT INTO migrations (name) VALUES (?)',
        { replacements: [migration.name] }
      );
      
      console.log(`Migration ${migration.name} completed successfully.`);
    }
    
    console.log('All migrations completed successfully.');
    
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

// PUBLIC_INTERFACE
/**
 * Check database health
 * @returns {Promise<Object>} Health status
 */
async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    
    // Test basic query
    await sequelize.query('SELECT 1');
    
    const responseTime = Date.now() - startTime;
    
    // Get database info
    const [results] = await sequelize.query(`
      SELECT 
        COUNT(*) as table_count
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    return {
      status: 'healthy',
      connection: 'active',
      response_time: responseTime,
      database_info: {
        dialect: sequelize.getDialect(),
        table_count: results[0].table_count,
      },
    };
    
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      connection: 'failed',
    };
  }
}

// PUBLIC_INTERFACE
/**
 * Close database connection gracefully
 * @returns {Promise<void>}
 */
async function closeDatabaseConnection() {
  try {
    await sequelize.close();
    console.log('Database connection closed gracefully.');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase,
  runMigrations,
  checkDatabaseHealth,
  closeDatabaseConnection,
};
