export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('bot_licenses', {
    session_name: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },

    plan: {
      type: Sequelize.ENUM('trial', 'pro'),
      allowNull: false,
      defaultValue: 'trial',
    },

    status: {
      type: Sequelize.ENUM('active', 'expired'),
      allowNull: false,
      defaultValue: 'active',
    },

    expires_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },

    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
    },

    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('NOW'),
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('bot_licenses');
}
