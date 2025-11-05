import cron from 'node-cron';
import { ConversationController } from '../bot/controllers/ConversationController.js';

const conversationController = new ConversationController();

export function startConversationResetScheduler() {
  cron.schedule('0 0 * * *', async () => {
    console.log('[🧹] Executando limpeza automática de histórico (00:00)...');

    try {
      const resetou = await conversationController.resetConvertsation();
      if (resetou) {
        console.log('[✅] Histórico de conversas apagado com sucesso!');
      } else {
        console.warn('[⚠️] Falha ao tentar limpar o histórico de conversas.');
      }
    } catch (error) {
      console.error('[❌] Erro ao limpar histórico:', error);
    }
  });

  console.log('[🕓] Agendador de limpeza diária de conversas iniciado.');
}
