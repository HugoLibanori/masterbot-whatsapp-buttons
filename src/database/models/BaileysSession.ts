import { Sequelize, Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';

export default class BaileysSession extends Model<
  InferAttributes<BaileysSession>,
  InferCreationAttributes<BaileysSession>
> {
  declare botId: number;
  declare data: any;
  declare created_at?: Date;
  declare updated_at?: Date;

  static initial(sequelize: Sequelize) {
    BaileysSession.init(
      {
        botId: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        data: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {},
        },
      },
      {
        sequelize,
        tableName: 'baileys_sessions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    );
  }
}
