const { Task, User } = require('../models');

class TaskController {
  // PUBLIC_INTERFACE
  /**
   * Get all tasks
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getAllTasks(req, res) {
    try {
      const { status, priority, user_id } = req.query;
      const whereClause = {};

      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (user_id) whereClause.user_id = user_id;

      const tasks = await Task.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        status: 'success',
        data: tasks
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch tasks'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get task by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async getTaskById(req, res) {
    try {
      const { id } = req.params;
      const task = await Task.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }]
      });

      if (!task) {
        return res.status(404).json({
          status: 'error',
          message: 'Task not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: task
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch task'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Create a new task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async createTask(req, res) {
    try {
      const { title, description, priority, due_date, user_id } = req.body;
      
      const task = await Task.create({
        title,
        description,
        priority: priority || 'medium',
        due_date: due_date ? new Date(due_date) : null,
        user_id
      });

      const taskWithUser = await Task.findByPk(task.id, {
        include: [{
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }]
      });

      res.status(201).json({
        status: 'success',
        data: taskWithUser
      });
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create task'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update task status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const task = await Task.findByPk(id);
      if (!task) {
        return res.status(404).json({
          status: 'error',
          message: 'Task not found'
        });
      }

      if (status === 'completed') {
        await task.markAsCompleted();
      } else {
        task.status = status;
        await task.save();
      }

      const updatedTask = await Task.findByPk(id, {
        include: [{
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] }
        }]
      });

      res.status(200).json({
        status: 'success',
        data: updatedTask
      });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update task'
      });
    }
  }
}

module.exports = new TaskController();
