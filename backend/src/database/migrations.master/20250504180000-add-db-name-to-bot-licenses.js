export async function up(queryInterface, Sequelize) {
  let table;
  try {
    table = await queryInterface.describeTable('bot_licenses');
  } catch {
    table = null;
  }

  if (!table) return;

  if (!table.db_name) {
    await queryInterface.addColumn('bot_licenses', 'db_name', {
      type: Sequelize.STRING(191),
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      'UPDATE `bot_licenses` SET db_name = session_name WHERE db_name IS NULL',
    );

    await queryInterface.changeColumn('bot_licenses', 'db_name', {
      type: Sequelize.STRING(191),
      allowNull: false,
    });
  }
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('bot_licenses', 'db_name').catch(() => {});
}
