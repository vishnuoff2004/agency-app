const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Route extends Model {
    static associate(models) {
      Route.belongsTo(models.Driver, { foreignKey: 'driverId' });
    }
  }

  Route.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      driverId: { type: DataTypes.INTEGER, allowNull: false },
      source: { type: DataTypes.STRING, allowNull: false },
      destination: { type: DataTypes.STRING, allowNull: false },
      departureTime: { type: DataTypes.DATE, allowNull: false },
      arrivalTime: { type: DataTypes.DATE, allowNull: false },
      fare: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      capacity: { type: DataTypes.INTEGER, allowNull: false },
      available: { type: DataTypes.BOOLEAN, defaultValue: true },
      status: {
        type: DataTypes.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active',
      },
    },
    { sequelize, modelName: 'Route', timestamps: true }
  );

  Route.addHook('afterCreate', (route) => {
    try {
      const { syncRouteToAlgolia } = require('../utils/algoliaSync');
      syncRouteToAlgolia(route.id);
    } catch (err) {
      console.error('Error in Route afterCreate hook:', err.message);
    }
  });

  Route.addHook('afterUpdate', (route) => {
    try {
      const { syncRouteToAlgolia } = require('../utils/algoliaSync');
      syncRouteToAlgolia(route.id);
    } catch (err) {
      console.error('Error in Route afterUpdate hook:', err.message);
    }
  });

  Route.addHook('afterDestroy', (route) => {
    try {
      const { deleteRouteFromAlgolia } = require('../utils/algoliaSync');
      deleteRouteFromAlgolia(route.id);
    } catch (err) {
      console.error('Error in Route afterDestroy hook:', err.message);
    }
  });

  return Route;
};
