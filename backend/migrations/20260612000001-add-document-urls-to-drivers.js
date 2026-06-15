'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Drivers');
    if (!table.licenseDocUrl) {
      await queryInterface.addColumn('Drivers', 'licenseDocUrl', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!table.vehicleRcUrl) {
      await queryInterface.addColumn('Drivers', 'vehicleRcUrl', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Drivers', 'licenseDocUrl');
    await queryInterface.removeColumn('Drivers', 'vehicleRcUrl');
  },
};
