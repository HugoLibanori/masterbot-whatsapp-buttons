import {
  Sequelize,
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export default class OtpCode extends Model<
  InferAttributes<OtpCode>,
  InferCreationAttributes<OtpCode>
> {
  declare id: CreationOptional<number>;
  declare phone: string;
  declare code: string;
  declare used: boolean;
  declare expires_at: Date;

  static initial(sequelize: Sequelize) {
    OtpCode.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        phone: { type: DataTypes.STRING(32), allowNull: false },
        code: { type: DataTypes.STRING(16), allowNull: false },
        used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        expires_at: { type: DataTypes.DATE, allowNull: false },
      },
      {
        sequelize,
        tableName: 'otp_codes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    );
  }
}
