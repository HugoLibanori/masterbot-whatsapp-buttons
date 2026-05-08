import { Sequelize } from 'sequelize';
import { xpRules, XPConfig } from '../configs/xp/xpRules.js';
import XpConfig from '../database/models/XpConfig.js';
import Bot from '../database/models/Bot.js';
import { prepareMasterDatabase } from '../database/migrate.js';

let masterConnection: Sequelize | null = null;

// Tipos protegidos (Usado apenas na direção XP -> Bot para evitar deletar padrões)
const TIPOS_PROTEGIDOS = ['dono', 'vip', 'premium', 'comum'];

function generateCleanKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

async function getMasterConnection() {
  if (!masterConnection) {
    masterConnection = await prepareMasterDatabase();
  }
  return masterConnection;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function applyConfig(newConfig: XPConfig) {
  xpRules.caps = cloneValue(newConfig.caps);
  xpRules.values = cloneValue(newConfig.values);
  xpRules.tiers = newConfig.tiers.map((t) => ({ ...t }));
}

// Direção: PAINEL XP -> BOT (Grava no Bot)
export async function synchronizeBotTiers(newConfig: XPConfig) {
  console.log('[SYNC] Painel -> Bot (Iniciando)...');

  const bot = await Bot.findOne();
  if (!bot) {
    console.error('[SYNC] Bot não encontrado.');
    return;
  }

  const currentData = bot.get({ plain: true });
  const currentLimiteDiario = currentData.limite_diario || {
    status: false,
    expiracao: 0,
    limite_tipos: {},
  };
  const currentLimiteTipos = currentLimiteDiario.limite_tipos || {};

  const updatedLimiteTipos: { [key: string]: { titulo: string; comandos: number | null } } = {};

  // 1. Adiciona tipos do Painel
  for (const tier of newConfig.tiers) {
    const cleanKey = generateCleanKey(tier.name);
    const finalKey = cleanKey || `tipo_${Math.floor(Math.random() * 1000)}`;

    updatedLimiteTipos[finalKey] = {
      titulo: tier.name,
      comandos: currentLimiteTipos[finalKey]?.comandos ?? 10,
    };
  }

  // 2. Mantém protegidos que não estão no painel
  for (const key in currentLimiteTipos) {
    const cleanOldKey = generateCleanKey(key);
    const jaFoiAdicionado =
      Object.keys(updatedLimiteTipos).includes(cleanOldKey) ||
      Object.keys(updatedLimiteTipos).includes(key);

    if (!jaFoiAdicionado) {
      if (TIPOS_PROTEGIDOS.includes(cleanOldKey) || TIPOS_PROTEGIDOS.includes(key)) {
        updatedLimiteTipos[key] = currentLimiteTipos[key];
      } else {
        console.log(`[SYNC] Removendo tipo obsoleto do Bot: ${key}`);
      }
    }
  }

  // 3. Defaults
  if (updatedLimiteTipos['dono'])
    updatedLimiteTipos['dono'] = { titulo: '💻 Dono', comandos: null };
  if (updatedLimiteTipos['vip']) {
    updatedLimiteTipos['vip'].titulo = '🎖️ VIP';
    updatedLimiteTipos['vip'].comandos = null;
  }
  if (updatedLimiteTipos['premium']) {
    updatedLimiteTipos['premium'].titulo = '🌟 Premium';
    if (!updatedLimiteTipos['premium'].comandos || updatedLimiteTipos['premium'].comandos === 10) {
      updatedLimiteTipos['premium'].comandos = 50;
    }
  }
  if (updatedLimiteTipos['comum']) {
    updatedLimiteTipos['comum'].titulo = '👤 Comum';
    if (updatedLimiteTipos['comum'].comandos !== 10) {
      updatedLimiteTipos['comum'].comandos = 10;
    }
  }

  // 4. Salva no Bot
  const novoLimiteDiario = {
    ...currentLimiteDiario,
    limite_tipos: updatedLimiteTipos,
  };

  await Bot.update({ limite_diario: novoLimiteDiario }, { where: { id: 1 } });
  console.log('[SYNC] Bot atualizado com sucesso.');
}

function validateXpConfig(config: XPConfig) {
  if (!config || typeof config !== 'object') throw new Error('Configuração inválida.');
  if (!config.tiers || !Array.isArray(config.tiers) || config.tiers.length === 0)
    throw new Error('Informe ao menos um nível de XP.');
}

export async function ensureXpConfigLoaded(): Promise<void> {
  await getMasterConnection();
  // Sem cache: lê direto do banco
  let current = await XpConfig.findOne();
  if (!current) {
    current = await XpConfig.create({ config: cloneValue(xpRules) });
  } else if (current.config) {
    applyConfig(current.config as XPConfig);
  }
}

export async function getXpConfig(): Promise<XPConfig> {
  await ensureXpConfigLoaded();
  return cloneValue(xpRules);
}

export async function updateXpConfig(newConfig: XPConfig): Promise<XPConfig> {
  await getMasterConnection();
  validateXpConfig(newConfig);
  const [row] = await XpConfig.findOrCreate({
    where: { id: 1 },
    defaults: { config: cloneValue(newConfig) },
  });
  row.config = cloneValue(newConfig);
  await row.save();
  await synchronizeBotTiers(newConfig);
  applyConfig(newConfig);
  return cloneValue(newConfig);
}

export async function createnewXpConfig(newTiers: XPConfig['tiers']): Promise<XPConfig['tiers']> {
  await getMasterConnection();
  const newConfig = {
    caps: xpRules.caps,
    values: xpRules.values,
    tiers: newTiers.map((t) => ({ ...t })),
  };
  validateXpConfig(newConfig);
  const [row] = await XpConfig.findOrCreate({
    where: { id: 1 },
    defaults: { config: cloneValue(newConfig) },
  });
  row.config = cloneValue(newConfig);
  await row.save();
  await synchronizeBotTiers(newConfig);
  applyConfig(newConfig);
  return cloneValue(newConfig.tiers);
}

export async function deleteTier(tierName: string): Promise<XPConfig['tiers']> {
  await getMasterConnection();
  await ensureXpConfigLoaded();
  const currentConfig = cloneValue(xpRules);
  const tierIndex = currentConfig.tiers.findIndex((t) => t.name === tierName);
  if (tierIndex === -1) throw new Error('Nível não encontrado.');
  currentConfig.tiers.splice(tierIndex, 1);
  validateXpConfig(currentConfig);
  const [row] = await XpConfig.findOrCreate({
    where: { id: 1 },
    defaults: { config: cloneValue(currentConfig) },
  });
  row.config = cloneValue(currentConfig);
  await row.save();
  await synchronizeBotTiers(currentConfig);
  applyConfig(currentConfig);
  return cloneValue(currentConfig.tiers);
}

export async function synchronizeTiersFromBot(limiteTipos: {
  [key: string]: { titulo: string; comandos: number | null };
}) {
  console.log('[SYNC] Bot -> Painel (Iniciando)...');
  await getMasterConnection();
  await ensureXpConfigLoaded();
  const currentConfig = cloneValue(xpRules);

  const newTiers: XPConfig['tiers'] = Object.entries(limiteTipos)
    .filter(([key]) => generateCleanKey(key) !== 'dono')
    .map(([key, value]) => {
      // Tenta achar configuração existente para preservar os valores de XP
      const existingTier = currentConfig.tiers.find(
        (t) =>
          generateCleanKey(t.name) === generateCleanKey(value.titulo) ||
          generateCleanKey(t.name) === generateCleanKey(key),
      );

      return {
        name: value.titulo,
        minTotal: existingTier?.minTotal ?? 0,
        maintainLast30: existingTier?.maintainLast30 ?? 0,
      };
    });

  const newConfig: XPConfig = { ...currentConfig, tiers: newTiers };

  // Salva na tabela XpConfig (que o Frontend lê)
  validateXpConfig(newConfig);
  const [row] = await XpConfig.findOrCreate({
    where: { id: 1 },
    defaults: { config: cloneValue(newConfig) },
  });
  row.config = cloneValue(newConfig);
  await row.save();

  applyConfig(newConfig);
  console.log('[SYNC] Painel XP atualizado com os tipos do Bot.');
}
