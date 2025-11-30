export async function up(queryInterface, Sequelize) {
  return await queryInterface.addColumn('bot', 'auto_reply_cooldown_seconds', {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 86400,
  });
}

export async function down(queryInterface) {
  return await queryInterface.removeColumn('bot', 'auto_reply_cooldown_seconds');
}
