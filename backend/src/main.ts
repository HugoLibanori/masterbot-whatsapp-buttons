import { connectWhatsapp } from './bootstrap/whatsapp.js';
import fs from 'fs-extra';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ quiet: true, path: path.resolve('.env') });

import { createDotEnv } from './utils/createDotEnv.js';
import { checkEnvironmentVariables } from './utils/utils.js';
import { promptSessionName } from './utils/promptSessionName.js';
import { prepareSessionDatabase } from './database/migrate.js';
import { createTrialIfNotExists, initSessionServices } from './bootstrap/app.js';
import { ensureXpConfigLoaded } from './services/XPConfigService.js';

async function connectBD() {
  await import('./database/index.js');
}

async function startBot() {
  try {
    const existDotEnv = fs.existsSync(path.resolve('.env'));
    if (!existDotEnv) await createDotEnv();

    checkEnvironmentVariables();
    await connectBD();
    await ensureXpConfigLoaded();
    const sessionName = await promptSessionName();

    // 1) Prepara o schema da sessão (cria DB, roda migrações e sincroniza modelos)
    const sessionSequelize = await prepareSessionDatabase(sessionName);

    // 2) Inicializa dados/recursos dependentes de DB
    await createTrialIfNotExists(sessionName);

    // 3) Agora sim, serviços que acessam a DB
    await initSessionServices(sessionName);

    // 4) Conecta o WhatsApp passando instância Sequelize da sessão
    await connectWhatsapp(sessionName, sessionSequelize);
  } catch (err) {
    console.error('Erro durante a inicialização do bot:', err);
  }
}

startBot();
