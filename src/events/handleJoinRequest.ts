import { RequestJoinAction, RequestJoinMethod } from '@itsukichan/baileys';

import * as types from '../types/BaileysTypes/index.js';
import { ISocket } from 'types/MyTypes/index.js';

const joinRequestMessages: Record<string, types.MyWAMessageKey> = {};

export async function handleJoinRequest(
  sock: ISocket,
  event: {
    id: string;
    author: string;
    participant: string;
    action: RequestJoinAction;
    method: RequestJoinMethod;
  },
) {
  const { id: groupId, participant, action } = event;
  const key = `${groupId}_${participant}`;

  console.log('Join Request Event:', event);

  const metadata = await sock.getGroupMetadata(groupId);

  const admins = metadata.participants
    .filter((member) => member.admin === 'admin' || member.admin === 'superadmin')
    .map((member) => member.id);

  const mentions = Array.from(new Set([participant, ...admins]));

  if (action === 'created') {
    const sentMsg = await sock.sendButtonsJoinRequets(groupId, {
      text: `👤 Usuário @${participant.replace(/@.+$/, '')} pediu para entrar no grupo.`,
      buttons: [
        {
          buttonId: `accept_${participant}`,
          buttonText: { displayText: 'Aceitar ✅' },
        },
        {
          buttonId: `reject_${participant}`,
          buttonText: { displayText: 'Recusar ❌' },
        },
      ],
      footer: 'Apenas administradores podem aceitar ou recusar.',
      mentions,
    });

    joinRequestMessages[key] = sentMsg.key;
  } else if (action === 'revoked' || action === 'rejected') {
    if (joinRequestMessages[key]) {
      await sock.deleteMessageJoinRequest(groupId, joinRequestMessages[key]);
      delete joinRequestMessages[key];
    }
  }
}

// Lida com a resposta dos botões de entrada do participante
export async function handleResponseButtonsJoinRequest(sock: ISocket, msg: types.MyWAMessage) {
  const buttonId = msg.message?.buttonsResponseMessage?.selectedButtonId;
  if (!buttonId) return;
  const groupId = msg.key.remoteJid;
  const isGroup = groupId.endsWith('@g.us');

  if (!isGroup) return;

  const metadata = await sock.getGroupMetadata(groupId);

  const isAdmin = metadata.participants.some(
    (member) =>
      member.id === msg.key.participantAlt &&
      (member.admin === 'admin' || member.admin === 'superadmin'),
  );

  const participant = buttonId.split('_')[1];
  const choice = buttonId.split('_')[0];
  const key = `${groupId}_${participant}`;

  if (!isAdmin && (choice === 'accept' || choice === 'reject')) {
    await sock.sendText(groupId, '[❗] Apenas administradores podem aceitar ou recusar.');
    await sock.deleteMessageJoinRequest(groupId, joinRequestMessages[key]);
    delete joinRequestMessages[key];
    handleJoinRequest(sock, {
      id: groupId,
      author: participant,
      participant,
      action: 'created',
      method: 'invite_link',
    });
    return;
  }

  if (choice.startsWith('accept')) {
    await sock.acceptGroupRequestParticipantsUpdate(groupId, [participant], 'approve');
    await sock.sendTextWithMentions(
      groupId,
      `✅ Pedido de @${participant.replace(/@.+$/, '')} aprovado.`,
      [participant],
    );
  } else if (choice.startsWith('reject')) {
    await sock.rejectGroupRequestParticipantsUpdate(groupId, [participant], 'reject');
    await sock.sendTextWithMentions(
      groupId,
      `❌ Pedido de @${participant.replace(/@.+$/, '')} rejeitado.`,
      [participant],
    );
  }

  if (joinRequestMessages[key]) {
    await sock.deleteMessageJoinRequest(groupId, joinRequestMessages[key]);
    delete joinRequestMessages[key];
  }
}
