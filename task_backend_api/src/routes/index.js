const express = require('express');
const healthController = require('../controllers/health');
const apiRoutes = require('./api');

const router = express.Router();

// Health endpoints
/**
 * @swagger
 * /:
 *   get:
 *     summary: Basic health endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 *                 uptime:
 *                   type: object
 *                   properties:
 *                     process:
 *                       type: integer
 *                       example: 3600
 *                     system:
 *                       type: integer
 *                       example: 86400
 */
router.get('/', healthController.check.bind(healthController));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Detailed health check including database
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overall_status:
 *                   type: string
 *                   example: healthy
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     connection:
 *                       type: string
 *                       example: active
 *                     response_time:
 *                       type: integer
 *                       example: 5
 *       503:
 *         description: Service is unhealthy
 */
router.get('/health', healthController.detailedCheck.bind(healthController));

/**
 * @swagger
 * /health/db:
 *   get:
 *     summary: Database health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Database is healthy
 *       503:
 *         description: Database is unhealthy
 */
router.get('/health/db', healthController.databaseCheck.bind(healthController));

// API routes
router.use('/api', apiRoutes);

module.exports = router;
