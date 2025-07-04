const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Task model for storing task information
 */
class Task extends Model {
  // PUBLIC_INTERFACE
  /**
   * Check if task is completed
   * @returns {boolean} True if task is completed, false otherwise
   */
  isCompleted() {
    return this.status === 'completed';
  }

  // PUBLIC_INTERFACE
  /**
   * Check if task is overdue
   * @returns {boolean} True if task is overdue, false otherwise
   */
  isOverdue() {
    if (!this.due_date) return false;
    return new Date() > new Date(this.due_date) && this.status !== 'completed';
  }

  // PUBLIC_INTERFACE
  /**
   * Mark task as completed
   * @returns {Promise<Task>} Updated task instance
   */
  async markAsCompleted() {
    this.status = 'completed';
    this.completed_at = new Date();
    return await this.save();
  }

  // PUBLIC_INTERFACE
  /**
   * Get task priority level as number
   * @returns {number} Priority level (1-5)
   */
  getPriorityLevel() {
    const priorities = { low: 1, medium: 2, high: 3, urgent: 4, critical: 5 };
    return priorities[this.priority] || 1;
  }
}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 200],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent', 'critical'),
      defaultValue: 'medium',
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['due_date'],
      },
    ],
  }
);

module.exports = Task;
