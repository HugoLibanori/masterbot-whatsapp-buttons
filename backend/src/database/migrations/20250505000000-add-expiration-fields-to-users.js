export async function up(queryInterface, Sequelize) {
  let table;
  try {
    table = await queryInterface.describeTable('users');
  } catch {
    table = null;
  }
  if (!table) return;

  const pendingAdds = [];

  if (!table.expira_em) {
    pendingAdds.push(
      queryInterface.addColumn('users', 'expira_em', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      }),
    );
  }

  if (!table.last_auto_reply_at) {
    pendingAdds.push(
      queryInterface.addColumn('users', 'last_auto_reply_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      }),
    );
  }

  if (!table.plano_ativo) {
    pendingAdds.push(
      queryInterface.addColumn('users', 'plano_ativo', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
    );
  }

  await Promise.all(pendingAdds);
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('users', 'expira_em').catch(() => {});
  await queryInterface.removeColumn('users', 'last_auto_reply_at').catch(() => {});
  await queryInterface.removeColumn('users', 'plano_ativo').catch(() => {});
}
