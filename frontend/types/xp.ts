export type XPEventType = 'sticker_create' | 'interaction' | 'referral_activated';

export interface XPCapRule {
  perHour?: number | null;
  cooldownSeconds?: number | null;
}

export interface XPTierRule {
  name: string;
  minTotal: number;
  maintainLast30: number;
}

export interface XPConfig {
  caps: Record<XPEventType, XPCapRule>;
  values: Record<XPEventType, number>;
  tiers: XPTierRule[];
}
