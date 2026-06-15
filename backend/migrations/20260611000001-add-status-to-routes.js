'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Routes');
    if (!table.status) {
      await queryInterface.addColumn('Routes', 'status', {
        type: Sequelize.ENUM('active', 'completed', 'cancelled'),
        defaultValue: 'active',
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Routes', 'status');
  },
};
