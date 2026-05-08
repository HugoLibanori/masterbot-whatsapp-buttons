export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('otp_codes', {
    id: { type: Sequelize.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
    phone: { type: Sequelize.STRING(32), allowNull: false },
    code: { type: Sequelize.STRING(16), allowNull: false },
    used: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    expires_at: { type: Sequelize.DATE, allowNull: false },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  })
  await queryInterface.addIndex('otp_codes', ['phone'])
}

export async function down(queryInterface) {
  await queryInterface.dropTable('otp_codes')
}
