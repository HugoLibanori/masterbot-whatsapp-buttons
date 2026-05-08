import {
  Sequelize,
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';

export default class AppUser extends Model<
  InferAttributes<AppUser>,
  InferCreationAttributes<AppUser>
> {
  declare id: CreationOptional<number>;
  declare phone: string | null;
  declare email: string | null;
  declare password_hash: string | null;

  static initial(sequelize: Sequelize) {
    AppUser.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        phone: { type: DataTypes.STRING(32), allowNull: true, unique: true },
        email: { type: DataTypes.STRING(255), allowNull: true, unique: true },
        password_hash: { type: DataTypes.STRING(255), allowNull: true },
      },
      {
        sequelize,
        tableName: 'app_users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    );
  }
}
