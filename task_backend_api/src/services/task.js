const { Task, User } = require('../models');
const { Op } = require('sequelize');

class TaskService {
  // PUBLIC_INTERFACE
  /**
   * Get all tasks with optional filtering
   * @param {Object} filters - Filter criteria
   * @param {string} filters.status - Filter by status
   * @param {string} filters.priority - Filter by priority
   * @param {number} filters.user_id - Filter by user ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Limit number of results
   * @param {number} options.offset - Offset for pagination
   * @returns {Promise<Object>} Tasks with metadata
   */
  async getAllTasks(filters = {}, options = {}) {
    try {
      const { status, priority, user_id } = filters;
      const { limit, offset } = options;
      const whereClause = {};

      // Build where clause for filtering
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (user_id) whereClause.user_id = user_id;

      const queryOptions = {
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }],
        order: [['created_at', 'DESC']]
      };

      // Add pagination if provided
      if (limit) queryOptions.limit = limit;
      if (offset) queryOptions.offset = offset;

      const { count, rows } = await Task.findAndCountAll(queryOptions);

      return {
        tasks: rows,
        total: count,
        pagination: {
          limit: limit || count,
          offset: offset || 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get task by ID
   * @param {number} id - Task ID
   * @returns {Promise<Object>} Task with user information
   */
  async getTaskById(id) {
    try {
      const task = await Task.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }]
      });

      if (!task) {
        throw new Error('Task not found');
      }

      return task;
    } catch (error) {
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Create a new task
   * @param {Object} taskData - Task data
   * @param {string} taskData.title - Task title
   * @param {string} taskData.description - Task description
   * @param {string} taskData.priority - Task priority
   * @param {Date} taskData.due_date - Task due date
   * @param {number} taskData.user_id - User ID
   * @returns {Promise<Object>} Created task with user information
   */
  async createTask(taskData) {
    try {
      const { title, description, priority, due_date, user_id } = taskData;

      // Validate required fields
      if (!title || !user_id) {
        throw new Error('Title and user_id are required');
      }

      // Verify user exists
      const user = await User.findByPk(user_id);
      if (!user) {
        throw new Error('User not found');
      }

      const task = await Task.create({
        title,
        description,
        priority: priority || 'medium',
        due_date: due_date ? new Date(due_date) : null,
        user_id
      });

      // Return task with user information
      return await this.getTaskById(task.id);
    } catch (error) {
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update a task
   * @param {number} id - Task ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated task
   */
  async updateTask(id, updateData) {
    try {
      const task = await Task.findByPk(id);
      if (!task) {
        throw new Error('Task not found');
      }

      const { title, description, priority, due_date, status } = updateData;

      // Update task fields
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (due_date !== undefined) task.due_date = due_date ? new Date(due_date) : null;
      
      if (status !== undefined) {
        if (status === 'completed') {
          await task.markAsCompleted();
        } else {
          task.status = status;
        }
      }

      await task.save();

      // Return updated task with user information
      return await this.getTaskById(id);
    } catch (error) {
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update task status only
   * @param {number} id - Task ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated task
   */
  async updateTaskStatus(id, status) {
    try {
      const task = await Task.findByPk(id);
      if (!task) {
        throw new Error('Task not found');
      }

      if (status === 'completed') {
        await task.markAsCompleted();
      } else {
        task.status = status;
        await task.save();
      }

      // Return updated task with user information
      return await this.getTaskById(id);
    } catch (error) {
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a task
   * @param {number} id - Task ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTask(id) {
    try {
      const task = await Task.findByPk(id);
      if (!task) {
        throw new Error('Task not found');
      }

      await task.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get tasks by user ID
   * @param {number} userId - User ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} User's tasks
   */
  async getTasksByUserId(userId, filters = {}) {
    try {
      const { status, priority } = filters;
      const whereClause = { user_id: userId };

      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;

      const tasks = await Task.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }],
        order: [['created_at', 'DESC']]
      });

      return tasks;
    } catch (error) {
      throw new Error(`Failed to fetch user tasks: ${error.message}`);
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get task statistics
   * @param {number} userId - Optional user ID for user-specific stats
   * @returns {Promise<Object>} Task statistics
   */
  async getTaskStats(userId = null) {
    try {
      const whereClause = userId ? { user_id: userId } : {};

      const [total, pending, inProgress, completed, cancelled] = await Promise.all([
        Task.count({ where: whereClause }),
        Task.count({ where: { ...whereClause, status: 'pending' } }),
        Task.count({ where: { ...whereClause, status: 'in_progress' } }),
        Task.count({ where: { ...whereClause, status: 'completed' } }),
        Task.count({ where: { ...whereClause, status: 'cancelled' } })
      ]);

      return {
        total,
        by_status: {
          pending,
          in_progress: inProgress,
          completed,
          cancelled
        },
        completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch task statistics: ${error.message}`);
    }
  }
}

module.exports = new TaskService();
