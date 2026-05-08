import { startApiServer } from './api/server.js';

// Inicia apenas a API. O WhatsApp é orquestrado por endpoints futuros.
startApiServer().catch((e) => {
  console.error('Erro ao iniciar API:', e);
  process.exit(1);
});
