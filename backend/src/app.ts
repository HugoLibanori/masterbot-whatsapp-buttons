import dns from 'node:dns';
import https from 'node:https';
import axios from 'axios';

dns.setDefaultResultOrder('ipv4first');
axios.defaults.httpsAgent = new https.Agent({ family: 4, keepAlive: true });

process.on('unhandledRejection', (reason: any) => {
  const msg = reason?.message || String(reason || '');
  const code = reason?.code || reason?.output?.statusCode;
  if (
    msg === 'Timed Out' ||
    code === 408 ||
    code === 'ECONNRESET' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH' ||
    code === 'EAI_AGAIN' ||
    code === 'ETIMEDOUT'
  ) {
    console.warn('⚠️ [REDE] Oscilação de conexão interceptada (não fatal):', msg || code);
    return;
  }
  console.warn('⚠️ [AVISO] Rejeição de promessa interceptada:', msg);
});

process.on('uncaughtException', (err: any) => {
  const code = err?.code;
  if (
    code === 'ECONNRESET' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH' ||
    code === 'EAI_AGAIN' ||
    code === 'ETIMEDOUT'
  ) {
    console.warn('⚠️ [REDE] Erro de rede/Wi-Fi interceptado (não fatal):', err?.message || code);
    return;
  }
  console.error('⚠️ [ERRO FATAL] Exceção não capturada:', err);
});

import { startApiServer } from './api/server.js';

// Inicia apenas a API. O WhatsApp é orquestrado por endpoints futuros.
startApiServer().catch((e) => {
  console.error('Erro ao iniciar API:', e);
  process.exit(1);
});
