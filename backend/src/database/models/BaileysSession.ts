import { Sequelize, Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';

export default class BaileysSession extends Model<
  InferAttributes<BaileysSession>,
  InferCreationAttributes<BaileysSession>
> {
  declare session_name: string;
  declare data: any;
  declare created_at?: Date;
  declare updated_at?: Date;

  static initial(sequelize: Sequelize) {
    BaileysSession.init(
      {
        session_name: {
          type: DataTypes.STRING(50),
          allowNull: false,
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
