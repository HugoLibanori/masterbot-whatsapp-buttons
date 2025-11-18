export interface Grupo {
  id_grupo: string;
  nome: string;
  participantes: string[];
  admins: string[];
  dono: string;
  restrito_msg: boolean;
  mutar: boolean;
  bemvindo: {
    status: boolean;
    msg: string;
  };
  antifake: {
    status: boolean;
    ddi_liberados: string[];
  };
  antilink: {
    status: boolean;
    filtros: {
      instagram: boolean;
      youtube: boolean;
      facebook: boolean;
      tiktok: boolean;
    };
  };
  antiporno: {
    status: boolean;
    time?: {
      start: string;
      end: string;
    };
  };
  antiflood?: {
    status: boolean;
    max: number;
    intervalo: number;
    msgs: string[];
  };
  autosticker?: boolean;
  contador: {
    status: boolean;
    inicio: string;
  };
  block_cmds: string[];
  lista_negra: string[];
  descricao: string;
  openai: { status: boolean };
}

export interface DataGrupoInitial {
  id_grupo: string;
  nome: string;
  descricao: string;
  participantes: string[];
  admins: string[];
  dono: string;
  restrito_msg: boolean;
}

export interface GrupoVerificado {
  id_grupo: string;
  nome: string;
  inicio: string;
  expiracao: string | null;
}
