import BotLicense from '../database/models/BotLicense.js';
import { XPService } from '../services/XPService.js';
import { startConversationResetScheduler } from '../schenduler/conversationResetScheduler.js';
import { startXPRecalcScheduler } from '../schenduler/xpRecalcScheduler.js';
import { startXPMonthlyResetScheduler } from '../schenduler/xpResetScheduler.js';

export async function createTrialIfNotExists(sessionName: string, owner_user_id?: number) {
  const exists = await BotLicense.findOne({ where: { session_name: sessionName } });

  if (!exists) {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    await BotLicense.create({
      session_name: sessionName,
      plan: 'trial',
      status: 'active',
      expires_at: expires,
      db_name: `DB_${sessionName.toLocaleUpperCase()}`,
      owner_user_id: owner_user_id ?? null,
    } as any);

    console.log(`[LICENÇA] Trial criado até ${expires.toISOString()}`);
  } else {
    // Se já existir e não tiver dono, assume para o usuário atual
    if ((exists as any).owner_user_id == null && owner_user_id) {
      await exists.update({ owner_user_id });
    }
  }
}

export async function initSessionServices(sessionName: string) {
  await XPService.init(sessionName);
  startConversationResetScheduler();
  startXPRecalcScheduler(sessionName);
  startXPMonthlyResetScheduler(sessionName);
}
