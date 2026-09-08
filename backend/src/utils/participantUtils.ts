import * as types from '../types/BaileysTypes/index.js';
import { ISocket } from '../types/MyTypes/index.js';
import { groupCache } from './caches.js';

export interface ResolvedParticipant {
  targetId: string;
  displayMention: string;
  isAdmin: boolean;
  isOwner: boolean;
  isBot: boolean;
  participant?: any;
}

export function isBotIdentifier(target: string, sock: ISocket, numberBot?: string, dataBotNumber?: string): boolean {
  const actualSock = (sock as any).sock || sock;
  const botRaw = [
    actualSock.user?.id,
    actualSock.user?.lid,
    actualSock.authState?.creds?.me?.id,
    actualSock.authState?.creds?.me?.lid,
    numberBot,
    dataBotNumber,
  ].filter(Boolean) as string[];

  const botJids = botRaw.map((s) => s.replace(/:\d+@/, '@').replace(/:\d+$/, ''));
  const botDigits = botRaw.map((s) => s.replace(/\D+/g, '')).filter(Boolean);

  const clean = target.replace(/:\d+@/, '@').replace(/:\d+$/, '');
  const digits = target.replace(/\D+/g, '');

  return (
    botJids.includes(clean) ||
    (clean.includes('@') && botJids.some((b) => b.split('@')[0] === clean.split('@')[0])) ||
    (Boolean(digits) && botDigits.includes(digits))
  );
}

export async function resolveGroupParticipant(
  sock: ISocket,
  groupId: string,
  targetInput: string,
  adminsDb: string[] = [],
  numberBot?: string,
  dataBotNumber?: string,
): Promise<ResolvedParticipant> {
  let groupMetadata: types.MyGroupMetadata | undefined = groupCache.get(groupId);
  try {
    const fresh = await sock.getGroupMetadata(groupId);
    if (fresh && fresh.participants?.length) {
      groupMetadata = fresh;
      groupCache.set(groupId, fresh);
    }
  } catch {}

  const targetClean = targetInput.replace(/:\d+@/, '@').replace(/:\d+$/, '').trim();
  const targetDigits = targetInput.replace(/\D+/g, '');
  const targetUser = targetClean.includes('@') ? targetClean.split('@')[0] : targetClean;

  const participant = groupMetadata?.participants?.find((p: any) => {
    const pId = (p.id || '').replace(/:\d+@/, '@').replace(/:\d+$/, '');
    const pLid = (p.lid || '').replace(/:\d+@/, '@').replace(/:\d+$/, '');
    const pPhone = (p.phoneNumber || '').replace(/:\d+@/, '@').replace(/:\d+$/, '');

    if (pId === targetClean || pLid === targetClean || pPhone === targetClean) return true;

    if (pId.includes('@') && pId.split('@')[0] === targetUser) return true;
    if (pLid.includes('@') && pLid.split('@')[0] === targetUser) return true;

    const pDigitsList = [p.id, (p as any).lid, (p as any).phoneNumber]
      .map((x) => String(x || '').replace(/\D+/g, ''))
      .filter(Boolean);

    if (targetDigits && pDigitsList.some((pd) => pd === targetDigits)) return true;

    return false;
  });

  const isOwner = Boolean(
    groupMetadata?.owner &&
      (participant?.id === groupMetadata.owner ||
        (participant as any)?.lid === groupMetadata.owner ||
        targetClean === groupMetadata.owner.replace(/:\d+@/, '@').replace(/:\d+$/, '')),
  );

  const isAdminInMeta =
    isOwner || participant?.admin === 'admin' || participant?.admin === 'superadmin';

  const isAdminInDb = (adminsDb || []).some((adm: string) => {
    const admClean = adm.replace(/:\d+@/, '@').replace(/:\d+$/, '');
    const admDigits = adm.replace(/\D+/g, '');
    return (
      admClean === targetClean ||
      (admClean.includes('@') && admClean.split('@')[0] === targetUser) ||
      (Boolean(targetDigits) && admDigits === targetDigits)
    );
  });

  const isAdmin = Boolean(isAdminInMeta || isAdminInDb);
  const targetId = participant?.id || targetInput;
  const displayMention = targetInput.includes('@') 
    ? targetInput.split('@')[0] 
    : targetId.replace(/@s\.whatsapp\.net|@lid/, '');

  const isBot = isBotIdentifier(targetId, sock, numberBot, dataBotNumber) ||
                isBotIdentifier(targetInput, sock, numberBot, dataBotNumber);

  return {
    targetId,
    displayMention,
    isAdmin,
    isOwner,
    isBot,
    participant,
  };
}
