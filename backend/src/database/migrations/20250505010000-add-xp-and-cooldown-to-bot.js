export async function up(queryInterface, Sequelize) {
  let table;
  try {
    table = await queryInterface.describeTable('bot');
  } catch {
    table = null;
  }
  if (!table) return;

  if (!table.xp) {
    await queryInterface.addColumn('bot', 'xp', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: JSON.stringify({ status: false }),
    });
  }

  if (!table.auto_reply_cooldown_seconds) {
    await queryInterface.addColumn('bot', 'auto_reply_cooldown_seconds', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  }
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('bot', 'xp').catch(() => {});
  await queryInterface.removeColumn('bot', 'auto_reply_cooldown_seconds').catch(() => {});
}
