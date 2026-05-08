export interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
}

export interface SessionItem {
  session_name: string;
  plan: string;
  status: string;
  expires_at: string | null;
  runtime: { status: string; updatedAt: number } | null;
  connected: boolean;
  is_owner_session?: boolean;
  customer?: Customer | null;
}

export interface SessionMetrics {
  session_name?: string;
  executed_cmds: number;
  started_at: string | null;
  users_total: number;
  groups_total: number;
  xp_events_total: number;
  xp_next_reset: string;
  generated_at: string;
}

export interface SessionLog {
  id: number;
  session_name: string;
  level: string;
  message: string;
  meta?: any;
  created_at: string;
}

export type XPPeriod = 'semanal' | 'mensal' | 'geral';

export interface XPLeaderboardEntry {
  position: number;
  user_id: string;
  name: string | null;
  total: number;
}
