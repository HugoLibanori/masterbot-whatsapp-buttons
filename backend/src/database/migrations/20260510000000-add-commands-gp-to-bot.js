export async function up(queryInterface, Sequelize) {
  let table;
  try {
    table = await queryInterface.describeTable('bot');
  } catch {
    table = null;
  }
  if (!table) return;
  if (table.commands_gp) return;

  await queryInterface.addColumn('bot', 'commands_gp', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('bot', 'commands_gp').catch(() => {});
}
