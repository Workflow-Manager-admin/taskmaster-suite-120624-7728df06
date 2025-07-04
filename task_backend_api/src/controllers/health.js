const healthService = require('../services/health');
const databaseService = require('../services/database');

class HealthController {
  // PUBLIC_INTERFACE
  /**
   * Basic health check endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {void}
   */
  check(req, res) {
    const healthStatus = healthService.getStatus();
    return res.status(200).json(healthStatus);
  }

  // PUBLIC_INTERFACE
  /**
   * Detailed health check including database status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async detailedCheck(req, res) {
    try {
      const basicHealth = healthService.getStatus();
      const dbHealth = await databaseService.getHealthStatus();
      
      const overallStatus = dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy';
      const statusCode = overallStatus === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json({
        ...basicHealth,
        overall_status: overallStatus,
        database: dbHealth,
        checks: {
          database: dbHealth.status === 'healthy' ? 'pass' : 'fail',
          service: 'pass',
        },
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'error',
        message: 'Health check failed',
        error: error.message,
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Database-specific health check
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async databaseCheck(req, res) {
    try {
      const dbHealth = await databaseService.getHealthStatus();
      const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
      
      res.status(statusCode).json(dbHealth);
    } catch (error) {
      console.error('Database health check error:', error);
      res.status(503).json({
        status: 'error',
        message: 'Database health check failed',
        error: error.message,
      });
    }
  }
}

module.exports = new HealthController();
