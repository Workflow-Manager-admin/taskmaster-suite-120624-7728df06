const os = require('os');
const process = require('process');

class HealthService {
  constructor() {
    this.startTime = Date.now();
  }

  // PUBLIC_INTERFACE
  /**
   * Get basic health status
   * @returns {Object} Health status object
   */
  getStatus() {
    const uptime = Date.now() - this.startTime;
    
    return {
      status: 'ok',
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: {
        process: Math.floor(uptime / 1000),
        system: Math.floor(os.uptime()),
      },
      version: process.env.npm_package_version || '1.0.0',
    };
  }

  // PUBLIC_INTERFACE
  /**
   * Get detailed system information
   * @returns {Object} Detailed system status
   */
  getDetailedStatus() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      ...this.getStatus(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        node_version: process.version,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usage_percent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
        },
        process_memory: {
          rss: memoryUsage.rss,
          heap_total: memoryUsage.heapTotal,
          heap_used: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
          load_average: os.loadavg(),
        },
      },
    };
  }
}

module.exports = new HealthService();
