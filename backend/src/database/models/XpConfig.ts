import { DataTypes, InferAttributes, InferCreationAttributes, Model, Sequelize } from 'sequelize';
import { XPConfig } from '../../configs/xp/xpRules.js';

export default class XpConfig extends Model<
  InferAttributes<XpConfig>,
  InferCreationAttributes<XpConfig>
> {
  declare id?: number;
  declare config: XPConfig;

  static initial(sequelize: Sequelize) {
    XpConfig.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        config: {
          type: DataTypes.JSON,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'xp_configs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    );
  }
}
