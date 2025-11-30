import { ISocket } from '../types/MyTypes/MySocket.js';

export const globalCooldown = new Map<string, number>();
export const globalAutoReplyCooldown = new Map<string, number>();

export function resetCooldown(id: string) {
  globalCooldown.delete(id);
}

export const cooldownPorTipo: Record<string, number> = {
  comum: 20,
  premium: 5,
  vip: 0,
  dono: 999,
};

export function barraProgresso(restante: number, total: number) {
  const largura = 10;
  const progresso = Math.round(((total - restante) / total) * largura);
  const barra = '▓'.repeat(progresso) + '░'.repeat(largura - progresso);
  const porcentagem = Math.round(((total - restante) / total) * 100);
  return `[${barra}] ${porcentagem}%`;
}

const cooldownAviso = new Map<string, number>();

export async function verificarCooldown(
  sock: ISocket,
  sender: string,
  tipo: string,
  pushName: string,
  id_chat: string,
) {
  const cooldown = cooldownPorTipo[tipo] ?? cooldownPorTipo['comum'];

  if (cooldown === 0 || cooldown === 999) return true;

  const agora = Date.now();
  const fimAnterior = globalCooldown.get(sender);

  if (fimAnterior && fimAnterior > agora) {
    const restante = Math.ceil((fimAnterior - agora) / 1000);

    const jaAvisou = cooldownAviso.get(sender);

    if (!jaAvisou || jaAvisou < agora) {
      await sock.sendText(
        id_chat,
        `⏳ *Cooldown ativo! Aguarde ${restante}s.*\n` +
          `🏷 Plano: *${tipo.toUpperCase()}*\n` +
          `${barraProgresso(restante, cooldown)}`,
      );

      cooldownAviso.set(sender, fimAnterior);
    }

    return false;
  }

  globalCooldown.set(sender, agora + cooldown * 1000);
  return true;
}

/**
 * Verifica cooldown específico para auto-replies no PV.
 * Retorna true se permitido (e registra novo cooldown), false se ainda estiver no cooldown.
 */
export function verificarAutoReplyCooldown(sender: string, seconds = 3600): boolean {
  if (!sender) return false;

  if (seconds <= 0) return true; // disabled

  const now = Date.now();
  const prev = globalAutoReplyCooldown.get(sender);
  if (prev && prev > now) return false;

  globalAutoReplyCooldown.set(sender, now + seconds * 1000);
  return true;
}
