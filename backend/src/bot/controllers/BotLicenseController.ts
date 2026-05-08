import { getClientDB } from '../../database/index.js';
import BotLicense from '../../database/models/BotLicense.js';

export const addDaysToSession = async (
  sessionName: string,
  dias: number,
  plan: 'trial' | 'pro' = 'pro',
): Promise<Date> => {
  if (isNaN(dias) || dias <= 0) {
    throw new Error('Quantidade de dias inválida.');
  }

  // ✅ Garante que está usando o BD DA SESSÃO CERTA
  getClientDB(sessionName);

  // ✅ Agora buscamos pela sessão correta
  let license = await BotLicense.findOne({
    where: { session_name: sessionName },
  });

  // ✅ Se não existir, cria
  if (!license) {
    const novaData = new Date();
    novaData.setDate(novaData.getDate() + dias);

    await BotLicense.create({
      session_name: sessionName,
      plan,
      status: 'active',
      expires_at: novaData,
    });

    return novaData;
  }

  // ✅ Se existir, soma na data atual
  const base =
    license.expires_at && license.expires_at > new Date()
      ? new Date(license.expires_at)
      : new Date();

  base.setDate(base.getDate() + dias);

  await license.update({
    expires_at: base,
    status: 'active',
    plan,
  });

  return base;
};
