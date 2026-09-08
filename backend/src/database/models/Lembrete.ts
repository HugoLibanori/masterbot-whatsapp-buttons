import { Sequelize, Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';

export default class Lembrete extends Model<
  InferAttributes<Lembrete>,
  InferCreationAttributes<Lembrete>
> {
  declare id: CreationOptional<number>;
  declare id_chat: string;
  declare id_usuario: string;
  declare push_name: CreationOptional<string>;
  declare texto: string;
  declare disparar_em: Date;
  declare enviado: CreationOptional<boolean>;
  declare is_group: CreationOptional<boolean>;

  static initial(sequelize: Sequelize) {
    Lembrete.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        id_chat: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        id_usuario: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        push_name: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: '',
        },
        texto: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        disparar_em: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        enviado: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        is_group: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: 'lembretes',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    );
  }
}
