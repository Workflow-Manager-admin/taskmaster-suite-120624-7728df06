const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * User model for storing user information
 */
class User extends Model {
  // PUBLIC_INTERFACE
  /**
   * Get user's full name
   * @returns {string} Full name of the user
   */
  getFullName() {
    return `${this.first_name} ${this.last_name}`;
  }

  // PUBLIC_INTERFACE
  /**
   * Check if user is admin
   * @returns {boolean} True if user is admin, false otherwise
   */
  isAdmin() {
    return this.role === 'admin';
  }

  // PUBLIC_INTERFACE
  /**
   * Convert user to JSON representation (excluding sensitive data)
   * @returns {object} User object without sensitive fields
   */
  toSafeJSON() {
    const { password, ...safeUser } = this.toJSON();
    return safeUser;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50],
      },
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50],
      },
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],
  }
);

module.exports = User;
