import { Sequelize } from 'sequelize';
import databaseConfig from './config/database.js';

import Bot from './models/Bot.js';
import Users from './models/User.js';
import Grupo from './models/Grupo.js';
import Contador from './models/Contador.js';
import GruposVerificados from './models/GrupoVerificado.js';
import Conversation from './models/Conversation.js';
import BaileysSession from './models/BaileysSession.js';
import XpEvent from './models/XpEvent.js';

const connection = new Sequelize(databaseConfig);

const models = [
  Bot,
  Users,
  Grupo,
  Contador,
  GruposVerificados,
  Conversation,
  BaileysSession,
  XpEvent,
];

models.forEach((model) => {
  if ('initial' in model && typeof model.initial === 'function') {
    model.initial(connection);
  }
});

export { connection };
