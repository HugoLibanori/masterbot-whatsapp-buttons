export async function up(queryInterface, Sequelize) {
  let table;
  try {
    table = await queryInterface.describeTable('bot');
  } catch {
    table = null;
  }
  if (!table) return;
  if (table.testers) return;

  await queryInterface.addColumn('bot', 'testers', {
    type: Sequelize.JSON,
    allowNull: false,
    defaultValue: [],
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('bot', 'testers').catch(() => {});
}
