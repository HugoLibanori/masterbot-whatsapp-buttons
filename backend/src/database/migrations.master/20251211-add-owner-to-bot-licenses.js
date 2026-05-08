export async function up(queryInterface, Sequelize) {
  const table = await queryInterface.describeTable('bot_licenses').catch(() => null)
  if (table && !('owner_user_id' in table)) {
    await queryInterface.addColumn('bot_licenses', 'owner_user_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
    })
    await queryInterface.addIndex('bot_licenses', ['owner_user_id'])
  }
}

export async function down(queryInterface) {
  const table = await queryInterface.describeTable('bot_licenses').catch(() => null)
  if (table && 'owner_user_id' in table) {
    await queryInterface.removeIndex('bot_licenses', ['owner_user_id']).catch(() => {})
    await queryInterface.removeColumn('bot_licenses', 'owner_user_id').catch(() => {})
  }
}
