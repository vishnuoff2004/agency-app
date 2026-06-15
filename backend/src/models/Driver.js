const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Driver extends Model {
    static associate(models) {
      Driver.belongsTo(models.User, { foreignKey: 'userId' });
      Driver.belongsTo(models.Agency, { foreignKey: 'agencyId' });
      Driver.hasMany(models.Route, { foreignKey: 'driverId' });
      Driver.hasMany(models.Booking, { foreignKey: 'driverId' });
    }
  }

  Driver.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      agencyId: { type: DataTypes.INTEGER, allowNull: true },
      name: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING, allowNull: false },
      vehicleType: {
        type: DataTypes.ENUM('Sedan', 'SUV', 'Hatchback', 'Van', 'Bus'),
        allowNull: true,
      },
      vehicleReg: { type: DataTypes.STRING, allowNull: true, unique: true },
      licenseNo: { type: DataTypes.STRING, allowNull: true },
      licenseDocUrl: { type: DataTypes.STRING, allowNull: true },
      vehicleRcUrl: { type: DataTypes.STRING, allowNull: true },
      available: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { sequelize, modelName: 'Driver', timestamps: true }
  );

  return Driver;
};
