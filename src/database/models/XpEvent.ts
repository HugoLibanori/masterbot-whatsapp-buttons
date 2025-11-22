import { Sequelize, Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export default class XpEvent extends Model<InferAttributes<XpEvent>, InferCreationAttributes<XpEvent>> {
  declare id: CreationOptional<number>;
  declare user_id: string;
  declare type: string;
  declare amount: number;
  declare meta: any | null;
  declare created_at: CreationOptional<Date>;

  static initial(sequelize: Sequelize) {
    XpEvent.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        amount: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        meta: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'xp_events',
        timestamps: false,
      }
    );
  }
}
