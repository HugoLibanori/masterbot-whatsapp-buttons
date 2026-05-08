import cron from 'node-cron';
import { XPService } from '../services/XPService.js';

export function startXPMonthlyResetScheduler(sessionName: string) {
  cron.schedule(
    '5 0 1 * *',
    async () => {
      console.log(`[XP] Reset mensal iniciado para a sessão ${sessionName}`);
      try {
        await XPService.resetAll(sessionName);
        console.log(`[XP] Reset mensal concluído para ${sessionName}`);
      } catch (error) {
        console.error('[XP] Erro ao reiniciar XP mensal:', error);
      }
    },
    {
      timezone: process.env.TZ,
    },
  );

  console.log('[XP] Agendador mensal de reset iniciado.');
}
