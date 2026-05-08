import crypto from 'node:crypto';
import BotLicense from '../database/models/BotLicense.js';

const OWNER_SESSION_NAME = process.env.OWNER_SESSION_NAME || 'BD_BOT';
const LICENSE_SALT = process.env.LICENSE_SALT || 'masterbot_secret_salt_2024';

/**
 * Gera uma chave de validação baseada no nome da sessão.
 * Útil para validar se a licença no banco é legítima.
 */
export function generateValidationKey(sessionName: string): string {
  return crypto
    .createHash('sha256')
    .update(sessionName + LICENSE_SALT)
    .digest('hex');
}

export async function isSessionActive(sessionName: string): Promise<boolean> {
  const license = await BotLicense.findOne({
    where: { session_name: sessionName },
  });

  if (!license) return false;

  // Bypas para o dono (definido no .env)
  if (sessionName === OWNER_SESSION_NAME) {
    if (license.status !== 'active') {
      await license.update({ status: 'active' });
    }
    return true;
  }

  // Verifica status básico
  if (license.status !== 'active') return false;

  // Verifica integridade da licença (Checksum)
  const expectedKey = generateValidationKey(sessionName);
  if (license.validation_key !== expectedKey) {
    console.error(`[LICENÇA] Chave de validação inválida para a sessão: ${sessionName}`);
    return false;
  }

  // Verifica expiração
  if (license.expires_at) {
    const now = new Date();
    if (now > license.expires_at) {
      await license.update({ status: 'expired' });
      return false;
    }
  }

  return true;
}
