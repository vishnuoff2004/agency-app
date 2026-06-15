const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Agency extends Model {
    static associate(models) {
      Agency.hasMany(models.Driver, { foreignKey: 'agencyId' });
      Agency.belongsTo(models.User, { foreignKey: 'adminId', as: 'admin' });
    }
  }

  Agency.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      phone: { type: DataTypes.STRING, allowNull: false },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      createdBy: { type: DataTypes.INTEGER, allowNull: false },
      adminId: { type: DataTypes.INTEGER, allowNull: true },
    },
    { sequelize, modelName: 'Agency', timestamps: true }
  );

  Agency.addHook('afterCreate', (agency) => {
    try {
      const { syncAgencyToAlgolia } = require('../utils/algoliaSync');
      syncAgencyToAlgolia(agency.id);
    } catch (err) {
      console.error('Error in Agency afterCreate hook:', err.message);
    }
  });

  Agency.addHook('afterUpdate', (agency) => {
    try {
      const { syncAgencyToAlgolia } = require('../utils/algoliaSync');
      syncAgencyToAlgolia(agency.id);
    } catch (err) {
      console.error('Error in Agency afterUpdate hook:', err.message);
    }
  });

  Agency.addHook('afterDestroy', (agency) => {
    try {
      const { deleteAgencyFromAlgolia } = require('../utils/algoliaSync');
      deleteAgencyFromAlgolia(agency.id);
    } catch (err) {
      console.error('Error in Agency afterDestroy hook:', err.message);
    }
  });

  return Agency;
};
