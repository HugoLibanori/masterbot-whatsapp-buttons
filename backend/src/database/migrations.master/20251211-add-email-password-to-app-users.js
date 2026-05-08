export async function up(queryInterface, Sequelize) {
  // adiciona colunas opcionais para compatibilidade com registros existentes
  await queryInterface.addColumn('app_users', 'email', {
    type: Sequelize.STRING(255),
    allowNull: true,
    unique: true,
  });
  await queryInterface.addColumn('app_users', 'password_hash', {
    type: Sequelize.STRING(255),
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('app_users', 'password_hash');
  await queryInterface.removeColumn('app_users', 'email');
}
