export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('app_users', {
    id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    phone: { type: Sequelize.STRING(32), allowNull: false, unique: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  })
}

export async function down(queryInterface) {
  await queryInterface.dropTable('app_users')
}
