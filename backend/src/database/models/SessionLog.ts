import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from 'sequelize';

export default class SessionLog extends Model<
  InferAttributes<SessionLog>,
  InferCreationAttributes<SessionLog>
> {
  declare id: CreationOptional<number>;
  declare session_name: string;
  declare level: string;
  declare message: string;
  declare meta: any | null;
  declare created_at: CreationOptional<Date>;

  static initial(sequelize: Sequelize) {
    SessionLog.init(
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        session_name: {
          type: DataTypes.STRING(191),
          allowNull: false,
        },
        level: {
          type: DataTypes.STRING(32),
          allowNull: false,
          defaultValue: 'info',
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        meta: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'session_logs',
        timestamps: false,
      },
    );
  }
}
