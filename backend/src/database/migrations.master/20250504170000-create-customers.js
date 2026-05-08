export async function up(queryInterface, Sequelize) {
  const exists = await queryInterface
    .describeTable('customers')
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    await queryInterface.createTable('customers', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(191),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      company: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  }

  const hasCustomerColumn = await queryInterface
    .describeTable('bot_licenses')
    .then((table) => !!table.customer_id)
    .catch(() => false);

  if (!hasCustomerColumn) {
    await queryInterface.addColumn('bot_licenses', 'customer_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('bot_licenses', ['customer_id']);
  }
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('bot_licenses', 'customer_id').catch(() => {});
  await queryInterface.dropTable('customers');
}
