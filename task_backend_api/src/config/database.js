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
});

// PUBLIC_INTERFACE
/**
 * Test database connection
 * @returns {Promise<void>}
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

// PUBLIC_INTERFACE
/**
 * Initialize database and sync models
 * @returns {Promise<void>}
 */
async function initializeDatabase() {
  try {
    await testConnection();
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase,
};
