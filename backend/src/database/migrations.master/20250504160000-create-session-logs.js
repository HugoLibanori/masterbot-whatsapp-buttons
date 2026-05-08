export async function up(queryInterface, Sequelize) {
  const exists = await queryInterface
    .describeTable('session_logs')
    .then(() => true)
    .catch(() => false);

  if (exists) return;

  await queryInterface.createTable('session_logs', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    session_name: {
      type: Sequelize.STRING(191),
      allowNull: false,
    },
    level: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'info',
    },
    message: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    meta: {
      type: Sequelize.JSON,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW'),
    },
  });

  await queryInterface.addIndex('session_logs', ['session_name', 'created_at']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('session_logs');
}
