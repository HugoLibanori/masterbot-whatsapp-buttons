import { Op, QueryInterface } from 'sequelize';
import { connection } from '../database/index.js';
import Users from '../database/models/User.js';
import XpEvent from '../database/models/XpEvent.js';
import { xpRules, XPEventType } from '../configs/xp/xpRules.js';

export class XPService {
  static async init() {
    // Ensure xp_events table exists (MySQL compatible)
    const qi: QueryInterface = connection.getQueryInterface();
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
          defaultValue: connection.literal('CURRENT_TIMESTAMP'),
        },
      } as any);
      try {
        await connection.query(
          'CREATE INDEX idx_xp_user_created ON xp_events (user_id, created_at)',
        );
      } catch {}
      try {
        await connection.query(
          'CREATE INDEX idx_xp_user_type_created ON xp_events (user_id, type, created_at)',
        );
      } catch {}
    }
  }

  static async addEvent(userId: string, type: XPEventType, meta: Record<string, any> = {}) {
    const amount = xpRules.values[type];
    if (!amount || !userId) return { changed: false };

    // Skip XP for bot owner
    const user = await Users.findOne({ where: { id_usuario: userId } });
    if (!user) return { changed: false };
    if (user.tipo === 'dono') return { changed: false };

    // Cooldown check
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

    // Per-hour cap check
    const perHourCap = xpRules.caps[type]?.perHour;
    if (perHourCap) {
      const oneHourAgo = new Date(Date.now() - 3600_000);
      const { sum } =
        (await XpEvent.findOne({
          where: { user_id: userId, type, created_at: { [Op.gte]: oneHourAgo } },
          attributes: [[connection.fn('SUM', connection.col('amount')), 'sum']],
          raw: true,
        })) || ({ sum: 0 } as any);

      if (Number(sum ?? 0) >= perHourCap) {
        return { changed: false };
      }
    }

    const oldTier = user.tipo;

    const existing = await XpEvent.findOne({
      where: { user_id: userId, type },
    });

    if (existing) {
      // Atualiza o único registro existente
      await existing.update({
        amount: existing.amount + amount,
        meta: meta || existing.meta,
        created_at: new Date(),
      });
    } else {
      // Cria somente se NÃO existir
      await XpEvent.create({
        user_id: userId,
        type,
        amount,
        meta,
      });
    }

    const changed = await this.recalculateTier(userId);

    if (!changed) return { changed: false };

    const updated = await Users.findOne({ where: { id_usuario: userId } });
    const newTier = updated?.tipo || oldTier;

    return { changed: newTier !== oldTier, oldTier, newTier };
  }

  static async getTotalXP(userId: string): Promise<number> {
    const { sum } =
      (await XpEvent.findOne({
        where: { user_id: userId },
        attributes: [[connection.fn('SUM', connection.col('amount')), 'sum']],
        raw: true,
      })) || ({ sum: 0 } as any);
    return Number(sum ?? 0);
  }

  static async getLast30DaysXP(userId: string): Promise<number> {
    const last30 = new Date(Date.now() - 30 * 24 * 3600_000);
    const { sum } =
      (await XpEvent.findOne({
        where: { user_id: userId, created_at: { [Op.gte]: last30 } },
        attributes: [[connection.fn('SUM', connection.col('amount')), 'sum']],
        raw: true,
      })) || ({ sum: 0 } as any);
    return Number(sum ?? 0);
  }

  static async recalculateTier(userId: string): Promise<boolean> {
    const user = await Users.findOne({ where: { id_usuario: userId } });
    if (!user) return false;

    // Preserve owner and active paid plan
    if (user.tipo === 'dono') return false;
    if (user.plano_ativo) return false;

    // If user's current tipo is not part of XP tier names, do not override (supports custom types)
    const tierNames = xpRules.tiers.map((t) => t.name);
    if (!tierNames.includes(user.tipo)) return false;

    const total = await this.getTotalXP(userId);
    const last30 = await this.getLast30DaysXP(userId);

    const tiers = [...xpRules.tiers].sort((a, b) => a.minTotal - b.minTotal);
    let newTier = 'comum';
    for (const t of tiers) {
      if (total >= t.minTotal && last30 >= t.maintainLast30) newTier = t.name;
    }

    if (newTier !== user.tipo) {
      await Users.update({ tipo: newTier }, { where: { id_usuario: userId } });
      return true;
    }
    return false;
  }

  static async removeUser(userId: string): Promise<void> {
    await XpEvent.destroy({ where: { user_id: userId } });
  }
}
