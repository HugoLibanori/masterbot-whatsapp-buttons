export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn('app_users', 'phone', {
    type: Sequelize.STRING(32),
    allowNull: true,
  })
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn('app_users', 'phone', {
    type: Sequelize.STRING(32),
    allowNull: false,
  })
}
