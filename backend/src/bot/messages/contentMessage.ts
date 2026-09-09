import { getContentType, generateWAMessageFromContent } from '@innovatorssoft/baileys';

import { MessageContent, TypeMessages } from '../../interfaces/index.js';
import { getDefaultMessageContent, removeWhatsAppFormatting, unwrapMessage, isViewOnceMessage } from '../../utils/utils.js';
import * as grupoController from '../controllers/GrupoController.js';
import * as userController from '../controllers/UserController.js';
import * as types from '../../types/BaileysTypes/index.js';
import { groupCache } from '../../utils/caches.js';

const normalizeQuoted = (raw: any): any => {
  if (!raw) return null;
  const unwrapped = unwrapMessage(raw);

  if (
    typeof unwrapped === 'object' &&
    (unwrapped.extendedTextMessage ||
      unwrapped.imageMessage ||
      unwrapped.videoMessage ||
      unwrapped.stickerMessage ||
      unwrapped.audioMessage ||
      unwrapped.documentMessage)
  ) {
    return unwrapped;
  }

  if (typeof unwrapped === 'string') {
    return { extendedTextMessage: { text: unwrapped } };
  }

  return unwrapped;
};

const contentMessage = async (
  sock: types.MyWASocket,
  message: types.MyWAMessage,
): Promise<MessageContent> => {
  try {
    const messageContent: MessageContent = getDefaultMessageContent();

    // Preencher id_chat / isGroup e sender já no início — necessário para casos
    // como mensagens view-once onde message.message pode não estar presente e
    // ainda assim precisamos do id do chat para tomar decisões (ex: auto-reply).
    let id_chat_initial = '';
    if (message?.key?.remoteJid?.includes('@g.us')) {
      id_chat_initial = message.key?.remoteJid?.replace(/:\d+/, '') ?? '';
    } else {
      id_chat_initial =
        message.key?.remoteJid?.replace(/:\d+/, '') ??
        message.key?.remoteJidAlt?.replace(/:\d+/, '') ??
        '';
    }
    messageContent.id_chat = id_chat_initial;
    messageContent.isGroup = id_chat_initial?.includes('@g.us') ?? false;
    // try to fill sender early, will be overridden later if message exists
    try {
      const participant = message.key?.participant || message.key?.remoteJid;
      if (participant) {
        const idUser = await userController.getUser(participant);
        messageContent.sender = idUser?.id_usuario || '';
      }
    } catch (e: any) {
      // console.error(e);
    }

    if (!message.message) return messageContent;

    const rawMsg = message.message;
    const msg = unwrapMessage(rawMsg);
    const type = getContentType(msg);
    const numberBot = sock.user?.lid?.replace(/:\d+/, '');
    const numberOwner = await userController.getOwner();

    const messageKey = type as keyof types.MyWAMessageContent;
    const content = msg?.[messageKey] as
      | {
          caption?: string;
          contextInfo?: { mentionedJid: string[] };
        }
      | undefined;

    messageContent.textFull = removeWhatsAppFormatting(
      content?.caption || msg?.conversation || msg?.extendedTextMessage?.text || '',
    );

    let id_chat = '';

    if (message?.key?.remoteJid?.includes('@g.us')) {
      id_chat = message.key?.remoteJid?.replace(/:\d+/, '') ?? '';
    } else {
      id_chat =
        message.key?.remoteJid?.replace(/:\d+/, '') ??
        message.key?.remoteJidAlt?.replace(/:\d+/, '') ??
        '';
    }

    const id_group = message.key?.remoteJid?.includes('@g.us') ? message.key?.remoteJid : null;

    messageContent.id_chat = id_chat;
    if (!id_chat) {
      // fallback attempts: if remoteJid exists use it, otherwise try remoteJidAlt,
      // then participantAlt/participant (useful for PV / view-once messages)
      const remote = message.key?.remoteJid ?? message.key?.remoteJidAlt;
      const partAlt = message.key?.participantAlt;
      const part = message.key?.participant;

      if (remote) {
        id_chat = String(remote).replace(/:\d+/, '');
        messageContent.id_chat = id_chat;
        messageContent.isGroup = id_chat?.includes('@g.us') ?? false;
      } else if (partAlt) {
        // if participantAlt looks like a user JID, treat it as chat id for PV
        if (String(partAlt).endsWith('@s.whatsapp.net') || String(partAlt).endsWith('@lid')) {
          id_chat = String(partAlt).replace(/:\d+/, '');
          messageContent.id_chat = id_chat;
          messageContent.isGroup = id_chat?.includes('@g.us') ?? false;
        }
      } else if (part) {
        if (String(part).endsWith('@s.whatsapp.net') || String(part).endsWith('@lid')) {
          id_chat = String(part).replace(/:\d+/, '');
          messageContent.id_chat = id_chat;
          messageContent.isGroup = id_chat?.includes('@g.us') ?? false;
        }
      }
      // Log mais detalhado para diagnosticar por que id_chat ficou vazio em msgs
      // view-once / com estruturas especiais. Não vaza todo o objeto, só campos
      // relevantes.
      const isViewOnceFlag = Boolean(
        message.message?.viewOnceMessageV2 ||
        message.message?.viewOnceMessageV2Extension ||
        (message.key && (message.key as any).isViewOnce),
      );

      console.warn('[WARN] id_chat ficou vazio — dados resumidos:', {
        remoteJid: message.key?.remoteJid,
        remoteJidAlt: message.key?.remoteJidAlt,
        participant: message.key?.participant,
        participantAlt: message.key?.participantAlt,
        isViewOnce: isViewOnceFlag,
        hasMessageBody: !!message.message,
      });
    }
    messageContent.isGroup = id_chat?.includes('@g.us') ?? false;
    messageContent.numberBot = numberBot ?? '';

    if (msg) {
      messageContent.type = type;
      messageContent.quotedMsg =
        type === typeMessages.TEXTEXT && !!msg.extendedTextMessage?.contextInfo?.quotedMessage;
      let buttonRaw = '';
      if (msg?.buttonsResponseMessage) {
        const selId = msg.buttonsResponseMessage.selectedButtonId?.trim();
        const selText = msg.buttonsResponseMessage.selectedDisplayText?.trim();
        // Se o buttonId for um comando (ex: .menu 1), prioriza ele sobre o displayText
        if (
          selId &&
          (selId.startsWith('.') ||
            selId.startsWith('!') ||
            selId.startsWith('#') ||
            selId.startsWith('/'))
        ) {
          buttonRaw = selId;
        } else {
          buttonRaw = selText || selId || '';
        }
      }

      messageContent.textReceived =
        (buttonRaw
          ? buttonRaw.split(' ').slice(1).join(' ').trim()
          : messageContent.textFull?.split(' ')?.slice(1)?.join(' ')?.trim()) ??
        '';
      messageContent.pushName = message.pushName;
      messageContent.sender = getJidBySuffix(message.key, '@s.whatsapp.net');
      messageContent.senderLid = getJidBySuffix(message.key, '@lid');

      // Normaliza os JIDs para comparar apenas a parte numérica
      const ownerData = await userController.getOwnerData();
      const ownerJid = ownerData?.id_usuario;
      const ownerLid = ownerData?.id_lid;

      messageContent.isOwnerBot = !!(
        (ownerJid &&
          (messageContent.sender === ownerJid ||
            messageContent.sender?.split('@')[0] === ownerJid.split('@')[0])) ||
        (ownerLid && (messageContent.senderLid === ownerLid || messageContent.sender === ownerLid))
      );

      messageContent.command =
        (buttonRaw
          ? buttonRaw.toLowerCase().trim().split(/\s+/)[0]
          : messageContent.textFull?.trim().split(/\s+/)[0]?.toLowerCase()) ||
        '';
      messageContent.args =
        (buttonRaw
          ? buttonRaw.trim().split(/\s+/).slice(1)
          : messageContent.textFull?.trim().split(/\s+/).slice(1)) ??
        [];
      messageContent.message = msg;
      messageContent.messageMedia = type !== typeMessages.TEXT && type !== typeMessages.EXTEXT;
    }

    if (messageContent.isGroup) {
      const groupInfo = (await grupoController.getGroup(id_group)) || {
        id_grupo: '',
        nome: '',
        participantes: [],
        admins: [],
        dono: '',
        restrito_msg: false,
        mutar: false,
        bemvindo: {
          status: false,
          msg: '',
        },
        antifake: {
          status: false,
          ddi_liberados: [],
        },
        antilink: {
          status: false,
          filtros: {
            instagram: false,
            youtube: false,
            facebook: false,
          },
        },
        antiporno: false,
        antiflood: {
          status: false,
          max: 0,
          intervalo: 0,
          msgs: [],
        },
        autosticker: false,
        contador: {
          status: false,
          inicio: '',
        },
        block_cmds: [],
        lista_negra: [],
        descricao: '',
      };
      let groupMetadata = groupCache.get(id_group) as types.MyGroupMetadata | undefined;

      if (!groupMetadata || !groupMetadata.participants || groupMetadata.participants.length === 0) {
        try {
          groupMetadata = await sock.groupMetadata(id_group);
          if (groupMetadata) groupCache.set(id_group, groupMetadata);
        } catch (err) {
          // Mantém o que tiver se falhar
        }
      }

      const senderCandidates = [
        messageContent.sender,
        messageContent.senderLid,
        message.key?.participant,
        message.key?.participantAlt,
      ]
        .filter(Boolean)
        .map((s) => String(s).replace(/:\d+@/, '@').replace(/:\d+$/, ''));
      const senderDigits = senderCandidates.map((s) => s.replace(/\D+/g, '')).filter(Boolean);

      const botRawCandidates = [
        sock.user?.id,
        sock.user?.lid,
        (sock as any).authState?.creds?.me?.id,
        (sock as any).authState?.creds?.me?.lid,
        numberBot,
      ].filter(Boolean) as string[];

      const botJids = botRawCandidates.map((s) => s.replace(/:\d+@/, '@').replace(/:\d+$/, ''));
      const botDigits = botRawCandidates.map((s) => s.replace(/\D+/g, '')).filter(Boolean);

      const isMatchUser = (p: types.MyGroupParticipant) => {
        const pId = p.id?.replace(/:\d+@/, '@').replace(/:\d+$/, '');
        const pLid = (p as any).lid?.replace(/:\d+@/, '@').replace(/:\d+$/, '');
        const pPhone = (p as any).phoneNumber?.replace(/:\d+@/, '@').replace(/:\d+$/, '');

        const pIdentifiers = [pId, pLid, pPhone].filter(Boolean) as string[];
        const pDigitsList = [p.id, (p as any).lid, (p as any).phoneNumber]
          .map((x) => String(x || '').replace(/\D+/g, ''))
          .filter(Boolean);

        const matchesJid = senderCandidates.some((s) =>
          pIdentifiers.some(
            (pid) =>
              s === pid ||
              (s.includes('@') && pid.includes('@') && s.split('@')[0] === pid.split('@')[0]),
          ),
        );
        if (matchesJid) return true;

        return senderDigits.some((sd) => pDigitsList.some((pd) => sd === pd));
      };

      const isMatchBot = (p: types.MyGroupParticipant) => {
        const pId = p.id?.replace(/:\d+@/, '@').replace(/:\d+$/, '');
        const pLid = (p as any).lid?.replace(/:\d+@/, '@').replace(/:\d+$/, '');
        const pPhone = (p as any).phoneNumber?.replace(/:\d+@/, '@').replace(/:\d+$/, '');

        const pIdentifiers = [pId, pLid, pPhone].filter(Boolean) as string[];
        const pDigitsList = [p.id, (p as any).lid, (p as any).phoneNumber]
          .map((x) => String(x || '').replace(/\D+/g, ''))
          .filter(Boolean);

        const matchesJid = botJids.some((b) =>
          pIdentifiers.some(
            (pid) =>
              b === pid ||
              (b.includes('@') && pid.includes('@') && b.split('@')[0] === pid.split('@')[0]),
          ),
        );
        if (matchesJid) return true;

        return botDigits.some((bd) => pDigitsList.some((pd) => bd === pd));
      };

      let groupOwner = (groupMetadata?.owner || '').replace(/:\d+@/, '@').replace(/:\d+$/, '');
      let isOwnerOfGroup =
        Boolean(groupOwner) &&
        (senderCandidates.includes(groupOwner) ||
          senderDigits.some((sd) => sd === groupOwner.replace(/\D+/g, '')));

      let participant = groupMetadata?.participants?.find(isMatchUser);
      let isUserAdmin =
        isOwnerOfGroup || participant?.admin === 'admin' || participant?.admin === 'superadmin';

      let botParticipant = groupMetadata?.participants?.find(isMatchBot);
      let isBotAdmin =
        botParticipant?.admin === 'admin' ||
        botParticipant?.admin === 'superadmin' ||
        (Boolean(groupOwner) &&
          (botJids.includes(groupOwner) ||
            botDigits.some((d) => d === groupOwner.replace(/\D+/g, ''))));

      // Se ainda não identificou como admin do usuário OU o bot não foi identificado como admin,
      // busca metadados frescos do WhatsApp para atualizar o cache
      if (!isUserAdmin || !isBotAdmin) {
        try {
          const freshMetadata = await sock.groupMetadata(id_group);
          if (freshMetadata && freshMetadata.participants?.length) {
            groupMetadata = freshMetadata;
            groupCache.set(id_group, freshMetadata);

            groupOwner = (freshMetadata.owner || '').replace(/:\d+@/, '@').replace(/:\d+$/, '');
            isOwnerOfGroup =
              Boolean(groupOwner) &&
              (senderCandidates.includes(groupOwner) ||
                senderDigits.some((sd) => sd === groupOwner.replace(/\D+/g, '')));

            participant = freshMetadata.participants.find(isMatchUser);
            isUserAdmin =
              isOwnerOfGroup ||
              participant?.admin === 'admin' ||
              participant?.admin === 'superadmin';

            botParticipant = freshMetadata.participants.find(isMatchBot);
            isBotAdmin =
              botParticipant?.admin === 'admin' ||
              botParticipant?.admin === 'superadmin' ||
              (Boolean(groupOwner) &&
                (botJids.includes(groupOwner) ||
                  botDigits.some((d) => d === groupOwner.replace(/\D+/g, ''))));
          }
        } catch (e) {
          // Ignora erro
        }
      }

      Object.assign(messageContent.grupo, {
        id_group: groupMetadata?.id ?? '',
        name: groupMetadata?.subject ?? '',
        description: groupMetadata?.desc ?? '',
        participants: groupMetadata?.participants?.map((p) => p.id) ?? [],
        owner: groupOwner,
        isBotAdmin,
        isAdmin: isUserAdmin,
        mentionedJid: content?.contextInfo?.mentionedJid ?? [],
        dataBd: groupInfo,
      });
    }

    if (msg && messageContent.quotedMsg) {
      const contextInfo = msg.extendedTextMessage?.contextInfo;
      let quotedMessageRaw = unwrapMessage(contextInfo?.quotedMessage);

      const quotedMsgId =
        contextInfo?.participant ||
        contextInfo?.remoteJid ||
        contextInfo?.remoteJidAlt ||
        (messageContent.isGroup ? '' : messageContent.id_chat) ||
        messageContent.sender ||
        '';

      if (quotedMessageRaw && quotedMsgId) {
        const quotedMessage = normalizeQuoted(quotedMessageRaw);
        const typeQuoted = getContentType(quotedMessage);
        messageContent.typeQuetedMessage = typeQuoted;

        const messageKeyQuoted = typeQuoted as keyof types.MyWAMessageContent;
        const quotedContent = (quotedMessage[messageKeyQuoted] || {}) as any;

        const seconds = quotedContent.seconds;
        const mimetype = quotedContent.mimetype;
        const caption = quotedContent.caption;
        const viewOnce =
          quotedContent.viewOnce === true ||
          Boolean(
            contextInfo?.quotedMessage?.viewOnceMessage ||
              contextInfo?.quotedMessage?.viewOnceMessageV2 ||
              contextInfo?.quotedMessage?.viewOnceMessageV2Extension,
          );

        const bodyText =
          (contextInfo?.quotedMessage?.conversation as string) ||
          (quotedContent?.text as string) ||
          (quotedContent?.caption as string) ||
          '';

        let generatedMessage: any = null;
        try {
          if (
            quotedMessage &&
            typeof quotedMessage === 'object' &&
            (quotedMessage.extendedTextMessage ||
              quotedMessage.imageMessage ||
              quotedMessage.videoMessage ||
              quotedMessage.stickerMessage ||
              quotedMessage.audioMessage ||
              quotedMessage.documentMessage)
          ) {
            generatedMessage = generateWAMessageFromContent(quotedMsgId, quotedMessage, {
              userJid: messageContent.sender,
            });
          } else if (typeof bodyText === 'string') {
            generatedMessage = generateWAMessageFromContent(
              quotedMsgId,
              { extendedTextMessage: { text: bodyText } },
              {
                userJid: messageContent.sender,
              },
            );
          }
        } catch (e) {
          console.warn('Falha ao gerar WAMessage a partir da quotedMessage:', e);
        }

        if (!generatedMessage && quotedMessage) {
          generatedMessage = {
            key: { id: quotedMsgId, remoteJid: id_chat },
            message: quotedMessage,
          };
        }

        const message_vunica =
          (!!typeQuoted && typeof typeQuoted === 'string' && viewOnce === true) ||
          isViewOnceMessage(contextInfo?.quotedMessage) ||
          isViewOnceMessage(quotedContent) ||
          Boolean(
            contextInfo?.quotedMessage?.viewOnceMessage ||
              contextInfo?.quotedMessage?.viewOnceMessageV2 ||
              contextInfo?.quotedMessage?.viewOnceMessageV2Extension,
          );

        messageContent.contentQuotedMsg = {
          type: typeQuoted,
          body: bodyText,
          sender: quotedMsgId.replace(/:\d+/, ''),
          seconds: seconds,
          message: generatedMessage,
          mimetype: mimetype,
          contentVunica: quotedMessage,
          caption: caption,
          message_vunica,
        };
      }
    }

    if (messageContent.messageMedia) {
      const midiaMsg = msg?.[type as keyof types.MyWAMessageContent] as
        | {
            mimetype?: string;
            url?: string;
            seconds?: string | number;
          }
        | undefined;

      if (midiaMsg && typeof midiaMsg === 'object' && 'mimetype' in midiaMsg) {
        messageContent.media = {
          mimetype: midiaMsg.mimetype ?? '',
          mediaUrl: midiaMsg.url ?? '',
          seconds: Number(midiaMsg.seconds ?? 0),
        };
      }
    }

    return messageContent;
  } catch (error) {
    console.error('Erro em contentMessage:', error);
    return getDefaultMessageContent();
  }
};

export default contentMessage;

export const typeMessages: TypeMessages = {
  TEXT: 'conversation',
  TEXTEXT: 'extendedTextMessage',
  EXTEXT: 'extendedTextMessage',
  IMAGE: 'imageMessage',
  DOCUMENT: 'documentMessage',
  VIDEO: 'videoMessage',
  STICKER: 'stickerMessage',
  AUDIO: 'audioMessage',
};

function getJidBySuffix(key: any, suffix: string) {
  return (
    [key?.participant, key?.participantAlt, key?.remoteJid, key?.remoteJidAlt]
      .filter(Boolean)
      .map((jid) => jid.replace(/:\d+/, ''))
      .find((j) => j.endsWith(suffix)) || null
  );
}
