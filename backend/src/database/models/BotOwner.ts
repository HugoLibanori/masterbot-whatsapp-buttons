import { DataTypes, Model, Sequelize } from 'sequelize';

export default class BotOwner extends Model {
  declare id: number;
  declare session_name: string;
  declare owner_number: string;

  static initial(sequelize: Sequelize) {
    BotOwner.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },

        session_name: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },

        owner_number: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'bot_owners',
      },
    );
  }
}
