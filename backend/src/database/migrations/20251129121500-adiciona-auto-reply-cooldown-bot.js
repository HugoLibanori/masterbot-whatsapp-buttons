export async function up(queryInterface, Sequelize) {
  let table;
  try {
    table = await queryInterface.describeTable('bot');
  } catch {
    table = null;
  }
  if (!table) return;
  if (table.auto_reply_cooldown_seconds) return;

  await queryInterface.addColumn('bot', 'auto_reply_cooldown_seconds', {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 86400,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('bot', 'auto_reply_cooldown_seconds').catch(() => {});
}
