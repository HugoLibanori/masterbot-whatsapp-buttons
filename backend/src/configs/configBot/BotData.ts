import NodeCache from 'node-cache';
import { Bot } from '../../interfaces/index.js';

const cache = new NodeCache({ stdTTL: 0, useClones: false });

const BOT_KEY = 'bot_info';

export const BotData = {
  set(data: Partial<Bot>) {
    cache.set(BOT_KEY, data);
  },
  get(): Partial<Bot> | null {
    return cache.get<Partial<Bot>>(BOT_KEY) ?? null;
  },
  clear() {
    cache.del(BOT_KEY);
  },
  has(): boolean {
    return cache.has(BOT_KEY);
  },
  // opcional: atualizar só um campo
  update(fields: Partial<Bot>) {
    const current = cache.get<Partial<Bot>>(BOT_KEY) ?? {};
    cache.set(BOT_KEY, { ...current, ...fields });
  },
};
