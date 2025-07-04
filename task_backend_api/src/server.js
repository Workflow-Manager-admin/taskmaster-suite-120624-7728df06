const app = require('./app');
const databaseService = require('./services/database');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Initialize database and start server
async function startServer() {
  try {
    console.log('Starting server initialization...');
    
    // Ensure database is initialized before starting server
    await databaseService.initialize({
      runSeeding: process.env.NODE_ENV === 'development',
      force: process.env.DB_FORCE_SYNC === 'true',
      alter: process.env.DB_ALTER_SYNC === 'true',
    });
    
    // Wait for database to be ready
    await databaseService.waitForReady();
    
    console.log('Database initialization completed successfully.');
    
    // Start HTTP server
    const server = app.listen(PORT, HOST, () => {
      console.log(`Server running at http://${HOST}:${PORT}`);
      console.log(`API Documentation available at http://${HOST}:${PORT}/docs`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      
      // Close HTTP server
      server.close(async () => {
        console.log('HTTP server closed');
        
        // Close database connection
        try {
          await databaseService.close();
          console.log('Database connection closed');
        } catch (error) {
          console.error('Error during database shutdown:', error);
        }
        
        console.log('Graceful shutdown completed');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
    
    return server;
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
