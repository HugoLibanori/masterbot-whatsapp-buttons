export interface User {
  id_usuario: string;
  id_lid: string;
  nome: string;
  comandos_total: number;
  comandos_dia: number;
  tipo: string;
  advertencia: number;
  pack: string | null;
  autor: string | null;
  expira_em: Date | null;
  plano_ativo: boolean;
}
