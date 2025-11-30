export interface Bot {
  started: Date;
  number_bot: string;
  name: string;
  name_admin: string;
  author_sticker: string;
  pack_sticker: string;
  prefix: string;
  executed_cmds: number;
  autosticker: boolean;
  block_cmds: string[];
  limite_diario: {
    status: boolean;
    expiracao: number;
    limite_tipos: {
      comum: {
        titulo: string;
        comandos: number;
      };
      premium: {
        titulo: string;
        comandos: number;
      };
      vip: {
        titulo: string;
        comandos: null;
      };
      dono: {
        titulo: string;
        comandos: null;
      };
      [key: string]: {
        titulo: string;
        comandos: number | null;
      };
    };
  };
  commands_pv: boolean;
  command_rate: CommandRate;
  grupo_oficial: string | null;
  apis: {
    google: {
      api_key: string;
    };
    simi: {
      api_key: string;
    };
    rapidAPI: {
      api_key: string;
    };
    openai: {
      api_key: string;
    };
  };
  openai: { status: boolean };
  xp: { status: boolean };
  auto_reply_cooldown_seconds?: number;
}
interface UsuarioComando {
  usuario_id: string;
  cmds: number;
  expiracao: number;
}

interface UsuarioLimitado {
  usuario_id: string;
  horario_liberacao: number;
}

interface CommandRate {
  status: boolean;
  max_cmds_minute: number;
  block_time: number;
  user: UsuarioComando[];
  user_limit: UsuarioLimitado[];
}
