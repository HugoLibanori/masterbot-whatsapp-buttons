export async function up(queryInterface, Sequelize) {
  return await queryInterface.addColumn('users', 'last_auto_reply_at', {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null,
  });
}

export async function down(queryInterface) {
  return await queryInterface.removeColumn('users', 'last_auto_reply_at');
}
