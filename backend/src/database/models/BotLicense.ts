import { DataTypes, Model, Sequelize } from 'sequelize';

class BotLicense extends Model {
  declare session_name: string;
  declare plan: 'trial' | 'pro';
  declare status: 'active' | 'expired';
  declare expires_at: Date;
  declare owner_user_id?: number | null;
  declare db_name: string;
  declare customer_id?: number | null;
  declare validation_key?: string | null;

  static initial(sequelize: Sequelize) {
    super.init(
      {
        session_name: {
          type: DataTypes.STRING,
          primaryKey: true,
        },

        plan: {
          type: DataTypes.ENUM('trial', 'pro'),
          defaultValue: 'trial',
        },

        status: {
          type: DataTypes.ENUM('active', 'expired'),
          defaultValue: 'active',
        },

        expires_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },

        owner_user_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },

        db_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        customer_id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true,
        },
        validation_key: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'bot_licenses',
        timestamps: true,
        underscored: true,
      },
    );
  }
}

export default BotLicense;
