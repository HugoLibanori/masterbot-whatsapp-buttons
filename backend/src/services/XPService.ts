import { Op, QueryInterface } from 'sequelize';
import { getClientDB } from '../database/index.js';
import Users from '../database/models/User.js';
import XpEvent from '../database/models/XpEvent.js';
import { xpRules, XPEventType } from '../configs/xp/xpRules.js';
import { ensureXpConfigLoaded } from './XPConfigService.js';

export class XPService {
  // ✅ Inicializa a tabela POR SESSÃO
  static async init(sessionName: string) {
    const db = getClientDB(sessionName);
    const qi: QueryInterface = db.getQueryInterface();

    try {
      await qi.describeTable('xp_events');
    } catch (_) {
      await qi.createTable('xp_events', {
        id: { type: 'BIGINT UNSIGNED', primaryKey: true, autoIncrement: true },
        user_id: { type: 'VARCHAR(255)', allowNull: false },
        type: { type: 'VARCHAR(64)', allowNull: false },
        amount: { type: 'INT', allowNull: false, defaultValue: 0 },
        meta: { type: 'JSON', allowNull: true },
        created_at: {
          type: 'DATETIME',
          allowNull: false,
          defaultValue: db.literal('CURRENT_TIMESTAMP'),
        },
      } as any);

      try {
        await db.query('CREATE INDEX idx_xp_user_created ON xp_events (user_id, created_at)');
      } catch {}

      try {
        await db.query(
          'CREATE INDEX idx_xp_user_type_created ON xp_events (user_id, type, created_at)',
        );
      } catch {}
    }
  }

  // ✅ ADD XP POR SESSÃO
  static async addEvent(
    sessionName: string,
    userId: string,
    type: XPEventType,
    meta: Record<string, any> = {},
  ) {
    const db = getClientDB(sessionName);
    await ensureXpConfigLoaded();
    const amount = xpRules.values[type];
    if (!amount || !userId) return { changed: false };

    // ✅ Usuário da sessão
    const user = await Users.findOne({ where: { id_usuario: userId } });
    if (!user) return { changed: false };
    if (user.tipo === 'dono') return { changed: false };

    // ✅ Cooldown
    const cooldown = xpRules.caps[type]?.cooldownSeconds ?? 0;
    if (cooldown > 0) {
      const recent = await XpEvent.findOne({
        where: { user_id: userId, type },
        order: [['created_at', 'DESC']],
      });

      if (recent) {
        const diff = Date.now() - new Date(recent.get('created_at') as Date).getTime();
        if (diff < cooldown * 1000) {
          return { changed: false };
        }
      }
    }

    // ✅ Limite por hora
    const perHourCap = xpRules.caps[type]?.perHour;
    if (perHourCap) {
      const oneHourAgo = new Date(Date.now() - 3600_000);

      const { sum } =
        (await XpEvent.findOne({
          where: {
            user_id: userId,
            type,
            created_at: { [Op.gte]: oneHourAgo },
          },
          attributes: [[db.fn('SUM', db.col('amount')), 'sum']],
          raw: true,
        })) || ({ sum: 0 } as any);

      if (Number(sum ?? 0) >= perHourCap) {
        return { changed: false };
      }
    }

    const oldTier = user.tipo;

    // ✅ Agora garante APENAS UM registro por tipo
    const existing = await XpEvent.findOne({
      where: { user_id: userId, type },
    });

    if (existing) {
      await existing.update({
        amount: existing.amount + amount,
        meta: meta || existing.meta,
        created_at: new Date(),
      });
    } else {
      await XpEvent.create({
        user_id: userId,
        type,
        amount,
        meta,
      });
    }

    const changed = await this.recalculateTier(sessionName, userId);
    if (!changed) return { changed: false };

    const updated = await Users.findOne({ where: { id_usuario: userId } });
    const newTier = updated?.tipo || oldTier;

    return { changed: newTier !== oldTier, oldTier, newTier };
  }

  // ✅ TOTAL XP POR SESSÃO
  static async getTotalXP(sessionName: string, userId: string): Promise<number> {
    const db = getClientDB(sessionName);

    const { sum } =
      (await XpEvent.findOne({
        where: { user_id: userId },
        attributes: [[db.fn('SUM', db.col('amount')), 'sum']],
        raw: true,
      })) || ({ sum: 0 } as any);

    return Number(sum ?? 0);
  }

  // ✅ XP 30 DIAS POR SESSÃO
  static async getLast30DaysXP(sessionName: string, userId: string): Promise<number> {
    const db = getClientDB(sessionName);
    const last30 = new Date(Date.now() - 30 * 24 * 3600_000);

    const { sum } =
      (await XpEvent.findOne({
        where: { user_id: userId, created_at: { [Op.gte]: last30 } },
        attributes: [[db.fn('SUM', db.col('amount')), 'sum']],
        raw: true,
      })) || ({ sum: 0 } as any);

    return Number(sum ?? 0);
  }

  // ✅ RECÁLCULO DE TIER POR SESSÃO
  static async recalculateTier(sessionName: string, userId: string): Promise<boolean> {
    const user = await Users.findOne({ where: { id_usuario: userId } });
    if (!user) return false;

    if (user.tipo === 'dono') return false;
    if (user.plano_ativo) return false;

    await ensureXpConfigLoaded();
    const tierNames = xpRules.tiers.map((t) => t.name);
    if (!tierNames.includes(user.tipo)) return false;

    const total = await this.getTotalXP(sessionName, userId);
    const last30 = await this.getLast30DaysXP(sessionName, userId);

    const tiers = [...xpRules.tiers].sort((a, b) => a.minTotal - b.minTotal);
    let newTier = 'comum';

    for (const t of tiers) {
      if (total >= t.minTotal && last30 >= t.maintainLast30) {
        newTier = t.name;
      }
    }

    if (newTier !== user.tipo) {
      await Users.update({ tipo: newTier }, { where: { id_usuario: userId } });
      return true;
    }

    return false;
  }

  // ✅ REMOVE XP POR SESSÃO
  static async removeUser(sessionName: string, userId: string): Promise<void> {
    await XpEvent.destroy({ where: { user_id: userId } });
  }

  static async resetAll(sessionName: string) {
    const db = getClientDB(sessionName);
    await this.init(sessionName);
    await db.query('DELETE FROM xp_events');
    await db.query(
      "UPDATE users SET tipo = 'comum' WHERE tipo <> 'dono' AND (plano_ativo IS NULL OR plano_ativo = 0)",
    );
  }

  static getNextResetDate(fromDate: Date = new Date()): Date {
    return new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1, 0, 0, 0, 0);
  }
}
