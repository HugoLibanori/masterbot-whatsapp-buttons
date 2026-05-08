import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function ensureLicenseSchema(sequelize: Sequelize) {
  const qi: QueryInterface = sequelize.getQueryInterface();

  // Customers table
  let hasCustomers = true;
  try {
    await qi.describeTable('customers');
  } catch {
    hasCustomers = false;
  }

  if (!hasCustomers) {
    await qi.createTable('customers', {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(191),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      company: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  }

  // bot_licenses columns
  let table: Record<string, any> | null = null;
  try {
    table = await qi.describeTable('bot_licenses');
  } catch {
    table = null;
  }

  if (!table) return;

  if (!table.db_name) {
    await qi.addColumn('bot_licenses', 'db_name', {
      type: DataTypes.STRING(191),
      allowNull: true,
    });
    await sequelize.query('UPDATE bot_licenses SET db_name = session_name WHERE db_name IS NULL');
    await qi.changeColumn('bot_licenses', 'db_name', {
      type: DataTypes.STRING(191),
      allowNull: false,
    });
  }

  if (!table.customer_id) {
    await qi.addColumn('bot_licenses', 'customer_id', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await qi.addIndex('bot_licenses', ['customer_id']);
  }
}
