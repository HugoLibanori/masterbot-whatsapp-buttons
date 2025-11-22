import cron from 'node-cron';
import Users from '../database/models/User.js';
import { XPService } from '../services/XPService.js';

export function startXPRecalcScheduler() {
  // Daily at 01:00
  cron.schedule('0 1 * * *', async () => {
    console.log('[XP] Recalculando tiers de usuários (01:00)...');
    try {
      const users = await Users.findAll({ attributes: ['id_usuario'] });
      for (const u of users) {
        await XPService.recalculateTier(u.id_usuario);
      }
      console.log('[XP] Recalculo de tiers concluído.');
    } catch (error) {
      console.error('[XP] Erro ao recalcular tiers:', error);
    }
  });

  console.log('[XP] Agendador diário de tiers iniciado.');
}
