import BotOwner from '../database/models/BotOwner.js';
import * as userController from '../bot/controllers/UserController.js';

export type Role = 'master' | 'session_owner' | 'group_admin' | 'user';

export async function isMaster(sender: string): Promise<boolean> {
  const master = await userController.getOwner();
  return sender.replace(/\D/g, '') === master;
}

export async function isSessionOwner(sender: string, sessionName: string) {
  const owner = await BotOwner.findOne({
    where: { session_name: sessionName },
  });

  if (!owner) return false;

  return owner.owner_number === sender.replace(/\D/g, '');
}

export async function getUserRole(
  sender: string,
  sessionName: string,
  isGroupAdmin: boolean,
): Promise<Role> {
  if (await isMaster(sender)) return 'master';

  if (await isSessionOwner(sender, sessionName)) return 'session_owner';

  if (isGroupAdmin) return 'group_admin';

  return 'user';
}
