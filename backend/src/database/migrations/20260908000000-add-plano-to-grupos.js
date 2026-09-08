export async function up(queryInterface, Sequelize) {
  let table;
  try {
    table = await queryInterface.describeTable('grupos');
  } catch {
    table = null;
  }
  if (!table) return;

  const pendingAdds = [];

  if (!table.plano_ativo) {
    pendingAdds.push(
      queryInterface.addColumn('grupos', 'plano_ativo', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
    );
  }

  if (!table.expira_em) {
    pendingAdds.push(
      queryInterface.addColumn('grupos', 'expira_em', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      }),
    );
  }

  await Promise.all(pendingAdds);
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('grupos', 'plano_ativo').catch(() => {});
  await queryInterface.removeColumn('grupos', 'expira_em').catch(() => {});
}
