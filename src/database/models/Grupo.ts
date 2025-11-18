import { Sequelize, Model, DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';

export default class Grupos extends Model<
  InferAttributes<Grupos>,
  InferCreationAttributes<Grupos>
> {
  declare id_grupo: string;
  declare nome: string;
  declare participantes: string[];
  declare admins: string[];
  declare dono: string;
  declare restrito_msg: boolean;
  declare mutar: boolean;
  declare bemvindo: {
    status: boolean;
    msg: string;
  };
  declare antifake: {
    status: boolean;
    ddi_liberados: string[];
  };
  declare antilink: {
    status: boolean;
    filtros: {
      instagram: boolean;
      youtube: boolean;
      facebook: boolean;
      tiktok: boolean;
    };
  };
  declare antiporno: { status: boolean; time?: { start: string; end: string } };
  declare antiflood: {
    status: boolean;
    max: number;
    intervalo: number;
    msgs: string[];
  };
  declare autosticker: boolean;
  declare contador: {
    status: boolean;
    inicio: string;
  };
  declare block_cmds: string[];
  declare lista_negra: string[];
  declare descricao: string;
  declare openai: {
    status: boolean;
  };
  static initial(sequelize: Sequelize) {
    Grupos.init(
      {
        id_grupo: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
        },
        nome: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        participantes: {
          type: DataTypes.JSON,
          allowNull: false,
        },
        admins: {
          type: DataTypes.JSON,
          allowNull: false,
        },
        dono: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        restrito_msg: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        mutar: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        bemvindo: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: { status: false, msg: '' },
        },
        antifake: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: { status: false, ddi_liberados: [] },
        },
        antilink: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {
            status: false,
            filtros: { instagram: false, youtube: false, facebook: false, tiktok: false },
          },
        },
        antiporno: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: { status: false, time: { start: '', end: '' } },
        },
        antiflood: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: { status: false, max: 10, intervalo: 10, msgs: [] },
        },
        autosticker: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        contador: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: { status: false, inicio: '' },
        },
        block_cmds: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        lista_negra: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        descricao: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        openai: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: { status: false },
        },
      },
      {
        sequelize,
        tableName: 'grupos',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    );
  }
}
