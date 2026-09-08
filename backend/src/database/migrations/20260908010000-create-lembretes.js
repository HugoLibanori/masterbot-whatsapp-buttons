export async function up(queryInterface, Sequelize) {
  let table;
  try {
    table = await queryInterface.describeTable('lembretes');
  } catch {
    table = null;
  }
  if (table) return;

  return await queryInterface.createTable('lembretes', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    id_chat: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    id_usuario: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    push_name: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '',
    },
    texto: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    disparar_em: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    enviado: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_group: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
  });
}

export async function down(queryInterface) {
  return await queryInterface.dropTable('lembretes').catch(() => {});
}
