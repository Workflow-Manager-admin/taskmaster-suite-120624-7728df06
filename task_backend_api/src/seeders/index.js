const { User, Task } = require('../models');

// PUBLIC_INTERFACE
/**
 * Seed database with initial data
 * @returns {Promise<void>}
 */
async function seedDatabase() {
  try {
    // Check if users already exist
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@example.com',
      password: 'admin123', // Will be hashed by model hook
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
    });

    // Create regular user
    const regularUser = await User.create({
      email: 'user@example.com',
      password: 'user123', // Will be hashed by model hook
      first_name: 'Regular',
      last_name: 'User',
      role: 'user',
    });

    // Create sample tasks
    await Task.bulkCreate([
      {
        title: 'Setup project documentation',
        description: 'Create comprehensive documentation for the project',
        status: 'pending',
        priority: 'high',
        user_id: adminUser.id,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        title: 'Review code quality',
        description: 'Perform code review and quality checks',
        status: 'in_progress',
        priority: 'medium',
        user_id: adminUser.id,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      },
      {
        title: 'Test application features',
        description: 'Test all application features and report bugs',
        status: 'pending',
        priority: 'medium',
        user_id: regularUser.id,
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      },
    ]);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

module.exports = {
  seedDatabase,
};
