export async function up(queryInterface, Sequelize) {
  const exists = await queryInterface
    .describeTable('bot_licenses')
    .then(() => true)
    .catch(() => false)

  if (exists) return

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
    owner_user_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
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
  })
  await queryInterface.addIndex('bot_licenses', ['owner_user_id'])
}

export async function down(queryInterface) {
  await queryInterface.dropTable('bot_licenses')
}
