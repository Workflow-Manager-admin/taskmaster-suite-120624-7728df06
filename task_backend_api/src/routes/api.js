const express = require('express');
const userController = require('../controllers/user');
const taskController = require('../controllers/task');
const { authenticate, requireAdmin } = require('../middleware');

const router = express.Router();

// Authentication routes
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *       409:
 *         description: User already exists
 */
router.post('/auth/register', userController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 */
router.post('/auth/login', userController.login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Authentication required
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Authentication required
 */
router.get('/auth/profile', authenticate, userController.getProfile);
router.put('/auth/profile', authenticate, userController.updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Authentication required or current password incorrect
 */
router.put('/auth/change-password', authenticate, userController.changePassword);

// User routes (Admin only)
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [user, admin]
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 default: user
 *     responses:
 *       201:
 *         description: User created successfully
 *       409:
 *         description: Email already exists
 */
router.get('/users', authenticate, requireAdmin, userController.getAllUsers);
router.post('/users', authenticate, requireAdmin, userController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/users/:id', authenticate, requireAdmin, userController.getUserById);

// Task routes
/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks with filtering support
 *     description: Retrieve all tasks with optional filtering by status, priority, and user ID. Results are ordered by creation date (newest first).
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Filter tasks by status
 *         example: pending
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent, critical]
 *         description: Filter tasks by priority level
 *         example: high
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter tasks by user ID (useful for admins)
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Limit number of results (pagination)
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Offset for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: List of tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: Complete project documentation
 *                       description:
 *                         type: string
 *                         example: Write comprehensive documentation for the task management system
 *                       status:
 *                         type: string
 *                         enum: [pending, in_progress, completed, cancelled]
 *                         example: pending
 *                       priority:
 *                         type: string
 *                         enum: [low, medium, high, urgent, critical]
 *                         example: high
 *                       due_date:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-15T10:30:00Z
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           first_name:
 *                             type: string
 *                             example: John
 *                           last_name:
 *                             type: string
 *                             example: Doe
 *                           email:
 *                             type: string
 *                             example: john@example.com
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-10T08:00:00Z
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-10T08:00:00Z
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                       description: Total number of tasks matching the filter
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         offset:
 *                           type: integer
 *                           example: 0
 *       401:
 *         description: Authentication required
 *   post:
 *     summary: Create a new task
 *     description: Create a new task and assign it to a user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - user_id
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Task title
 *                 example: Complete project documentation
 *               description:
 *                 type: string
 *                 description: Detailed task description
 *                 example: Write comprehensive documentation for the task management system
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent, critical]
 *                 default: medium
 *                 description: Task priority level
 *                 example: high
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date
 *                 example: 2024-01-15T10:30:00Z
 *               user_id:
 *                 type: integer
 *                 description: ID of the user assigned to the task
 *                 example: 1
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 */
router.get('/tasks', authenticate, taskController.getAllTasks);
router.post('/tasks', authenticate, taskController.createTask);

/**
 * @swagger
 * /api/tasks/stats:
 *   get:
 *     summary: Get task statistics
 *     description: Get task statistics including counts by status and completion rate
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Get statistics for a specific user (optional)
 *         example: 1
 *     responses:
 *       200:
 *         description: Task statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     by_status:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                           example: 8
 *                         in_progress:
 *                           type: integer
 *                           example: 5
 *                         completed:
 *                           type: integer
 *                           example: 10
 *                         cancelled:
 *                           type: integer
 *                           example: 2
 *                     completion_rate:
 *                       type: integer
 *                       example: 40
 *                       description: Percentage of completed tasks
 *       401:
 *         description: Authentication required
 */
router.get('/tasks/stats', authenticate, taskController.getTaskStats);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, in_progress, completed, cancelled]
 *                     priority:
 *                       type: string
 *                       enum: [low, medium, high, urgent, critical]
 *                     due_date:
 *                       type: string
 *                       format: date-time
 *                     user_id:
 *                       type: integer
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *                         email:
 *                           type: string
 *       404:
 *         description: Task not found
 *       401:
 *         description: Authentication required
 *   put:
 *     summary: Update task (full update)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *               description:
 *                 type: string
 *                 description: Task description
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent, critical]
 *                 description: Task priority
 *               due_date:
 *                 type: string
 *                 format: date-time
 *                 description: Task due date
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *                 description: Task status
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *       404:
 *         description: Task not found
 *       401:
 *         description: Authentication required
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Task deleted successfully
 *       404:
 *         description: Task not found
 *       401:
 *         description: Authentication required
 *   patch:
 *     summary: Update task status only
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *                 description: New task status
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *       404:
 *         description: Task not found
 *       401:
 *         description: Authentication required
 */
router.get('/tasks/:id', authenticate, taskController.getTaskById);
router.put('/tasks/:id', authenticate, taskController.updateTask);
router.delete('/tasks/:id', authenticate, taskController.deleteTask);
router.patch('/tasks/:id/status', authenticate, taskController.updateTaskStatus);

module.exports = router;
