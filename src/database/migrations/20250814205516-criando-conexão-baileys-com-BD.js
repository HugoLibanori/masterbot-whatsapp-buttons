export async function up(queryInterface, Sequelize) {
  return await queryInterface.createTable("baileys_sessions", {
    bot_id: {
      type: Sequelize.INTEGER.UNSIGNED,
      primaryKey: true,
      allowNull: false,
    },
    data: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {},
    },
    created_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn("NOW"),
    },
    updated_at: {
      allowNull: false,
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn("NOW"),
    },
  });
}

export async function down(queryInterface) {
  return await queryInterface.dropTable("baileys_sessions");
}
