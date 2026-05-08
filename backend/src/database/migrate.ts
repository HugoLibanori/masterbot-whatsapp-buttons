import fs from 'fs-extra';
import path from 'path';
import url from 'url';
import { Sequelize, QueryTypes } from 'sequelize';
import * as SequelizeLib from 'sequelize';
import databaseConfig from './config/database.js';
import { getClientDB, closeClientDB } from './index.js';

async function ensureSequelizeMetaTable(sequelize: Sequelize) {
  const qi = sequelize.getQueryInterface();
  try {
    await qi.describeTable('SequelizeMeta');
  } catch {
    await qi.createTable('SequelizeMeta', {
      name: { type: (SequelizeLib as any).STRING, allowNull: false, primaryKey: true },
    } as any);
  }
}

async function runMigrationsAtDir(sequelize: Sequelize, migrationsDir: string) {
  await ensureSequelizeMetaTable(sequelize);

  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.js')).sort();

  const appliedRows = (await sequelize.query('SELECT name FROM `SequelizeMeta`', {
    type: QueryTypes.SELECT,
  })) as Array<{ name: string }>;
  const applied = new Set(appliedRows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;

    const fullPath = path.resolve(migrationsDir, file);
    const modulePath = url.pathToFileURL(fullPath).href;
    const mod = await import(modulePath);
    const up = mod.up || (mod.default && mod.default.up);
    if (typeof up !== 'function') {
      console.warn(`Migração ${file} não possui função up válida, ignorando.`);
      continue;
    }
    const qi = sequelize.getQueryInterface();
    console.log(`[DB] Executando migração: ${file}`);
    await up(qi, SequelizeLib);
    await sequelize.query('INSERT INTO `SequelizeMeta` (name) VALUES (:name)', {
      replacements: { name: file },
      type: QueryTypes.INSERT,
    });
  }

  console.log('[DB] Migrações aplicadas.');
}

async function runMigrations(sequelize: Sequelize) {
  const distDir = path.resolve(process.cwd(), 'dist/database/migrations');
  const srcDir = path.resolve(process.cwd(), 'src/database/migrations');
  const migrationsDir = (await fs.pathExists(distDir)) ? distDir : srcDir;
  await runMigrationsAtDir(sequelize, migrationsDir);
}

export async function prepareMasterDatabase(): Promise<Sequelize> {
  const { createDatabaseConnection } = await import('./index.js');
  const sequelize = createDatabaseConnection();

  const distDir = path.resolve(process.cwd(), 'dist/database/migrations.master');
  const srcDir = path.resolve(process.cwd(), 'src/database/migrations.master');
  const migrationsDir = (await fs.pathExists(distDir)) ? distDir : srcDir;

  if (await fs.pathExists(migrationsDir)) {
    await runMigrationsAtDir(sequelize, migrationsDir);
  } else {
    console.warn('[DB] Pasta de migrações master não encontrada:', migrationsDir);
  }

  return sequelize;
}

export async function ensureMySQLDatabaseExists(sessionName: string) {
  if (databaseConfig.dialect !== 'mysql') return;

  const adminSequelize = new Sequelize(
    'mysql',
    (databaseConfig as any).username,
    (databaseConfig as any).password,
    {
      host: (databaseConfig as any).host,
      port: (databaseConfig as any).port,
      dialect: 'mysql',
      logging: (databaseConfig as any).logging ?? false,
    },
  );

  try {
    await adminSequelize.query(
      `CREATE DATABASE IF NOT EXISTS \`${sessionName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await adminSequelize.close();
  }
}

export async function prepareSessionDatabase(sessionName: string): Promise<Sequelize> {
  await ensureMySQLDatabaseExists(sessionName);

  const sequelize = getClientDB(sessionName);

  await sequelize.authenticate();

  // Se existir sistema de migrations
  if (typeof runMigrations === 'function') {
    await runMigrations(sequelize);
  }

  return sequelize;
}

export async function dropSessionDatabase(sessionName: string) {
  if (databaseConfig.dialect !== 'mysql') return;

  // fecha conexão cacheada se existir
  try {
    await closeClientDB(sessionName);
  } catch {}

  const adminSequelize = new Sequelize(
    'mysql',
    (databaseConfig as any).username,
    (databaseConfig as any).password,
    {
      host: (databaseConfig as any).host,
      port: (databaseConfig as any).port,
      dialect: 'mysql',
      logging: (databaseConfig as any).logging ?? false,
    },
  );

  try {
    await adminSequelize.query(`DROP DATABASE IF EXISTS \`${sessionName}\``);
    console.log(`[DB] Banco da sessão ${sessionName} removido.`);
  } finally {
    await adminSequelize.close();
  }
}
