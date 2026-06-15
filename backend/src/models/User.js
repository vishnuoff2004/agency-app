const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Driver, { foreignKey: 'userId' });
      User.hasMany(models.Booking, { foreignKey: 'userId' });
      User.hasOne(models.Agency, { foreignKey: 'adminId', as: 'managedAgency' });
    }
  }

  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM('traveler', 'driver', 'agency_admin', 'admin'),
        defaultValue: 'traveler',
      },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      loginAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
      lockedUntil: { type: DataTypes.DATE, allowNull: true },
      otpCode: { type: DataTypes.STRING(6), allowNull: true },
      otpExpiry: { type: DataTypes.DATE, allowNull: true },
      isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { sequelize, modelName: 'User', timestamps: true }
  );

  User.addHook('afterCreate', (user) => {
    try {
      const { syncUserToAlgolia } = require('../utils/algoliaSync');
      syncUserToAlgolia(user.id);
    } catch (err) {
      console.error('Error in User afterCreate hook:', err.message);
    }
  });

  User.addHook('afterUpdate', (user) => {
    try {
      const { syncUserToAlgolia } = require('../utils/algoliaSync');
      syncUserToAlgolia(user.id);
    } catch (err) {
      console.error('Error in User afterUpdate hook:', err.message);
    }
  });

  User.addHook('afterDestroy', (user) => {
    try {
      const { deleteUserFromAlgolia } = require('../utils/algoliaSync');
      deleteUserFromAlgolia(user.id);
    } catch (err) {
      console.error('Error in User afterDestroy hook:', err.message);
    }
  });

  return User;
};
