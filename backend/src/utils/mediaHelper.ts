import https from 'https';
import {
  downloadMediaMessage,
  downloadContentFromMessage,
  normalizeMessageContent,
} from '@innovatorssoft/baileys';

export const ipv4Agent = new https.Agent({ family: 4 });

/**
 * Verifica recursivamente se a mensagem era originalmente de visualização única
 */
export const isViewOnceMessage = (msg: any): boolean => {
  if (!msg || typeof msg !== 'object') return false;
  if (msg.viewOnce === true) return true;
  if (msg.viewOnceMessage || msg.viewOnceMessageV2 || msg.viewOnceMessageV2Extension) return true;
  if (msg.message && isViewOnceMessage(msg.message)) return true;
  if (msg.ephemeralMessage?.message && isViewOnceMessage(msg.ephemeralMessage.message)) return true;
  if (
    msg.imageMessage?.viewOnce === true ||
    msg.videoMessage?.viewOnce === true ||
    msg.audioMessage?.viewOnce === true
  ) {
    return true;
  }
  return false;
};

/**
 * Desembrulha recursivamente qualquer mensagem que esteja encapsulada
 * em ephemeralMessage, viewOnceMessage, viewOnceMessageV2, viewOnceMessageV2Extension,
 * documentWithCaptionMessage, etc.
 */
export const unwrapMessage = (rawMsg: any): any => {
  if (!rawMsg || typeof rawMsg !== 'object') return rawMsg;

  // Usa o normalizador nativo do Baileys primeiro
  let current = normalizeMessageContent(rawMsg) || rawMsg;

  // Garantia extra de desempacotamento recursivo caso haja múltiplos níveis
  let depth = 0;
  while (current && typeof current === 'object' && depth < 10) {
    depth++;
    if (current.ephemeralMessage?.message) {
      current = current.ephemeralMessage.message;
    } else if (current.viewOnceMessage?.message) {
      current = current.viewOnceMessage.message;
    } else if (current.viewOnceMessageV2?.message) {
      current = current.viewOnceMessageV2.message;
    } else if (current.viewOnceMessageV2Extension?.message) {
      current = current.viewOnceMessageV2Extension.message;
    } else if (current.documentWithCaptionMessage?.message) {
      current = current.documentWithCaptionMessage.message;
    } else {
      break;
    }

    const next = normalizeMessageContent(current);
    if (next && next !== current) {
      current = next;
    }
  }

  return current;
};

/**
 * Baixa mídia de forma segura, com suporte a IPv4, mensagens diretas,
 * mensagens citadas (quoted) e visualização única (view-once).
 */
export const downloadMediaSafe = async (
  messageInput: any,
  preferredType?: any,
): Promise<Buffer> => {
  if (!messageInput) {
    throw new Error('Nenhuma mensagem fornecida para download.');
  }

  const downloadOptions = {
    options: {
      httpsAgent: ipv4Agent,
      timeout: 30000,
    },
    agent: ipv4Agent,
    httpsAgent: ipv4Agent,
  };

  // 1. Tentar com Baileys downloadMediaMessage
  try {
    let targetWAMsg = messageInput;
    if (!targetWAMsg?.message) {
      targetWAMsg = { key: {}, message: messageInput };
    }

    const buffer = await downloadMediaMessage(targetWAMsg, 'buffer', downloadOptions as any);
    if (buffer && Buffer.isBuffer(buffer) && buffer.length > 0) {
      return buffer;
    }
  } catch (err: any) {
    // Falha silenciosa para tentar fallback direto
  }

  // 2. Fallback: extrair o objeto de mídia diretamente e usar downloadContentFromMessage
  const unwrapped = unwrapMessage(messageInput?.message || messageInput);
  const mediaObj =
    unwrapped?.imageMessage ||
    unwrapped?.videoMessage ||
    unwrapped?.stickerMessage ||
    unwrapped?.audioMessage ||
    unwrapped?.documentMessage;

  if (mediaObj && (mediaObj.directPath || mediaObj.url) && mediaObj.mediaKey) {
    let mediaType = typeof preferredType === 'string' ? preferredType.replace('Message', '') : '';
    if (!mediaType || !['image', 'video', 'sticker', 'audio', 'document'].includes(mediaType)) {
      if (unwrapped?.imageMessage) mediaType = 'image';
      else if (unwrapped?.videoMessage) mediaType = 'video';
      else if (unwrapped?.stickerMessage) mediaType = 'sticker';
      else if (unwrapped?.audioMessage) mediaType = 'audio';
      else if (unwrapped?.documentMessage) mediaType = 'document';
      else mediaType = 'image';
    }

    const stream = await downloadContentFromMessage(
      mediaObj,
      mediaType as any,
      downloadOptions as any,
    );
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const result = Buffer.concat(chunks);
    if (result && result.length > 0) {
      return result;
    }
  }

  throw new Error('Não foi possível extrair nem baixar a mídia.');
};
