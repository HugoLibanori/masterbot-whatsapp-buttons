import { Sequelize } from 'sequelize';
import databaseConfig from './config/database.js';

import Bot from './models/Bot.js';
import Users from './models/User.js';
import Grupo from './models/Grupo.js';
import Contador from './models/Contador.js';
import Conversation from './models/Conversation.js';
import BaileysSession from './models/BaileysSession.js';
import XpEvent from './models/XpEvent.js';
import BotLicense from './models/BotLicense.js';
import BotOwner from './models/BotOwner.js';
import SessionLog from './models/SessionLog.js';
import Customer from './models/Customer.js';
import XpConfig from './models/XpConfig.js';

// ✅ cache de conexões por cliente
const connections: Record<string, Sequelize> = {};

const models = [
  Bot,
  Users,
  Grupo,
  Contador,
  Conversation,
  BaileysSession,
  XpEvent,
  BotLicense, // master only
  BotOwner,
  SessionLog,
  Customer,
  XpConfig,
];

// Modelos carregados por conexão de sessão (não inclui BotLicense para manter no MASTER)
const sessionModels = [Bot, Users, Grupo, Contador, Conversation, BaileysSession, XpEvent, BotOwner];

// ✅ CONEXÃO PADRÃO (BD_BOT)
export function createDatabaseConnection(customDatabase?: string) {
  const config = customDatabase ? { ...databaseConfig, database: customDatabase } : databaseConfig;

  const connection = new Sequelize(config);

  models.forEach((model) => {
    if ('initial' in model && typeof model.initial === 'function') {
      model.initial(connection);
    }
  });

  return connection;
}

// ✅ CONEXÃO POR CLIENTE (BD_DADOS_cliente1)
export function getClientDB(sessionName: string): Sequelize {
  const dbName = `${sessionName}`;

  if (!connections[dbName]) {
    const config = { ...databaseConfig, database: dbName };
    connections[dbName] = new Sequelize(config);
  }

  const connection = connections[dbName];

  sessionModels.forEach((model) => {
    if ('initial' in model && typeof model.initial === 'function') {
      const currentSequelize = (model as any).sequelize;
      if (currentSequelize !== connection) {
        model.initial(connection);
      }
    }
  });

  return connection;
}

export async function closeClientDB(sessionName: string) {
  const dbName = `${sessionName}`;
  const conn = connections[dbName];
  if (conn) {
    try {
      await conn.close();
    } catch {}
    delete connections[dbName];
  }
}
