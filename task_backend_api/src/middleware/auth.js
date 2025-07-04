const authService = require('../services/auth');

// PUBLIC_INTERFACE
/**
 * Authentication middleware to protect routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const user = await authService.getUserByToken(token);
    
    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Authentication failed',
    });
  }
};

// PUBLIC_INTERFACE
/**
 * Admin authorization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * @returns {void}
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin()) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required',
    });
  }
  next();
};

// PUBLIC_INTERFACE
/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions',
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  requireAdmin,
  requireRole,
};
