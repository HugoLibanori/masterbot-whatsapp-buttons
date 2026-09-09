import { MessageContent } from '../interfaces/index.js';
import * as types from '../types/BaileysTypes/index.js';

export type DownloadPlatform = 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'unknown';

export interface ExtractedLinkResult {
  url: string | null;
  platform: DownloadPlatform;
  targetMessage: types.MyWAMessage;
  isFromQuoted: boolean;
  extraArgs?: string;
}

const REGEX_URL = /(https?:\/\/[^\s]+)/gi;
const REGEX_DOMAIN_URL =
  /((?:https?:\/\/)?(?:www\.|m\.|music\.|vm\.|vt\.|web\.)?(?:instagram\.com|instagr\.am|facebook\.com|fb\.watch|fb\.com|tiktok\.com|youtube\.com|youtu\.be)\/[^\s]+)/gi;

const REGEX_INSTAGRAM = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/.+/i;
const REGEX_FACEBOOK = /^(https?:\/\/)?(www\.|m\.|mbasic\.|web\.)?(facebook\.com|fb\.watch|fb\.com)\/.+/i;
const REGEX_YOUTUBE = /^(https?:\/\/)?(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\/.+/i;
const REGEX_TIKTOK = /^(https?:\/\/)?(www\.|vm\.|vt\.)?(tiktok\.com)\/.+/i;

export function cleanUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim();
  // Remove pontuações, aspas e parênteses colados no início ou fim do link
  url = url.replace(/^[<("'`]+/, '');
  url = url.replace(/[.,;!?)"'`]+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
}

export function detectPlatform(url: string): DownloadPlatform {
  if (!url) return 'unknown';
  if (REGEX_INSTAGRAM.test(url)) return 'instagram';
  if (REGEX_TIKTOK.test(url)) return 'tiktok';
  if (REGEX_YOUTUBE.test(url)) return 'youtube';
  if (REGEX_FACEBOOK.test(url)) return 'facebook';
  return 'unknown';
}

export function extractDownloadLink(
  messageContent: MessageContent,
  message: types.MyWAMessage,
): ExtractedLinkResult {
  const { textReceived, quotedMsg, contentQuotedMsg } = messageContent;

  let foundUrl: string | null = null;
  let isFromQuoted = false;
  let extraArgs = '';

  // 1. Tentar encontrar URL no texto enviado junto com o comando (args)
  if (textReceived) {
    let matches = textReceived.match(REGEX_URL);
    if (!matches || matches.length === 0) {
      matches = textReceived.match(REGEX_DOMAIN_URL);
    }
    if (matches && matches.length > 0) {
      foundUrl = cleanUrl(matches[0]);
      extraArgs = textReceived.replace(matches[0], '').trim();
      extraArgs = extraArgs.replace(/^[!/#][\w\d_]+/i, '').trim();
    }
  }

  // 2. Se não encontrou no texto direto e a mensagem é uma resposta/citação (quotedMsg)
  if (!foundUrl && quotedMsg && contentQuotedMsg) {
    const quotedText = (contentQuotedMsg.body || contentQuotedMsg.caption || '').trim();
    if (quotedText) {
      let matches = quotedText.match(REGEX_URL);
      if (!matches || matches.length === 0) {
        matches = quotedText.match(REGEX_DOMAIN_URL);
      }
      if (matches && matches.length > 0) {
        foundUrl = cleanUrl(matches[0]);
        isFromQuoted = true;
        extraArgs = (textReceived || '').replace(/^[!/#][\w\d_]+/i, '').trim();
      }
    }
  }

  const platform = foundUrl ? detectPlatform(foundUrl) : 'unknown';

  // O alvo da resposta deve ser a mensagem que continha o link (citada ou direta)
  const targetMessage =
    isFromQuoted && contentQuotedMsg?.message ? contentQuotedMsg.message : message;

  return {
    url: foundUrl,
    platform,
    targetMessage,
    isFromQuoted,
    extraArgs,
  };
}
