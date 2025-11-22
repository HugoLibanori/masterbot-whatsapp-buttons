export type XPEventType = 'sticker_create' | 'interaction' | 'referral_activated';

export interface XPCapRule {
  perHour?: number;
  cooldownSeconds?: number;
}

export interface XPTierRule {
  name: 'comum' | 'premium' | 'vip' | string;
  minTotal: number;
  maintainLast30: number;
}

export interface XPConfig {
  caps: Record<XPEventType, XPCapRule>;
  values: Record<XPEventType, number>;
  tiers: XPTierRule[];
}

export const xpRules: XPConfig = {
  caps: {
    sticker_create: { perHour: 60, cooldownSeconds: 5 },
    interaction: { perHour: 240, cooldownSeconds: 2 },
    referral_activated: { perHour: 100, cooldownSeconds: 0 },
  },
  values: {
    sticker_create: 10,
    interaction: 2,
    referral_activated: 1000,
  },
  tiers: [
    { name: 'comum', minTotal: 0, maintainLast30: 0 },
    { name: 'premium', minTotal: 1000, maintainLast30: 200 },
    { name: 'vip', minTotal: 5000, maintainLast30: 1000 },
  ],
};
