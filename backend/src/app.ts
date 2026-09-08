import dns from 'node:dns';
import https from 'node:https';
import axios from 'axios';

dns.setDefaultResultOrder('ipv4first');
axios.defaults.httpsAgent = new https.Agent({ family: 4, keepAlive: true });
import { startApiServer } from './api/server.js';

// Inicia apenas a API. O WhatsApp é orquestrado por endpoints futuros.
startApiServer().catch((e) => {
  console.error('Erro ao iniciar API:', e);
  process.exit(1);
});
