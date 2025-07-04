const app = require('./app');
const databaseService = require('./services/database');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`API Documentation available at http://${HOST}:${PORT}/docs`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  
  // Close HTTP server
  server.close(async () => {
    console.log('HTTP server closed');
    
    // Close database connection
    try {
      await databaseService.close();
    } catch (error) {
      console.error('Error during database shutdown:', error);
    }
    
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = server;
