const User = require('./User');
const Task = require('./Task');

// Define associations
User.hasMany(Task, {
  foreignKey: 'user_id',
  as: 'tasks',
  onDelete: 'CASCADE',
});

Task.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// PUBLIC_INTERFACE
/**
 * Initialize all models and their associations
 * @returns {object} Object containing all models
 */
function getModels() {
  return {
    User,
    Task,
  };
}

module.exports = {
  User,
  Task,
  getModels,
};
