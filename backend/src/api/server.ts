import http, { IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import {
  prepareMasterDatabase,
  prepareSessionDatabase,
  dropSessionDatabase,
} from '../database/migrate.js';
import AppUser from '../database/models/AppUser.js';
import OtpCode from '../database/models/OtpCode.js';
import { Sequelize } from 'sequelize';
import { connectWhatsapp } from '../bootstrap/whatsapp.js';
import { createTrialIfNotExists } from '../bootstrap/app.js';
import { setSessionStatus, getSessionInfo, setSessionQr, resetSession } from './sessionState.js';
import { getSocket, stopSession } from './sessionRuntime.js';
import BotLicense from '../database/models/BotLicense.js';
import Customer from '../database/models/Customer.js';
import BaileysSession from '../database/models/BaileysSession.js';
import crypto from 'node:crypto';
import { onlyNumbers } from '../utils/utils.js';
import SessionLog from '../database/models/SessionLog.js';
import { logSessionEvent } from '../utils/sessionLogger.js';
import { getClientDB } from '../database/index.js';
import { XPService } from '../services/XPService.js';
import {
  ensureXpConfigLoaded,
  getXpConfig,
  updateXpConfig,
  createnewXpConfig,
  deleteTier,
} from '../services/XPConfigService.js';
import { ensureLicenseSchema } from '../database/utils/ensureLicenseSchema.js';

const OWNER_EMAIL = (process.env.ADMIN_EMAIL || 'hugolibanori@gmail.com').toLowerCase();
const OWNER_SESSION_NAME = process.env.OWNER_SESSION_NAME || 'BD_BOT';
const MS_IN_DAY = 24 * 60 * 60 * 1000;
type XPPeriod = 'geral' | 'mensal' | 'semanal';

let masterDB: Sequelize;

async function initDB() {
  masterDB = await prepareMasterDatabase();
  // Inicializa modelos "master" explicitamente nesta conexão
  AppUser.initial(masterDB);
  OtpCode.initial(masterDB);
  await masterDB.sync();
  await ensureLicenseSchema(masterDB);
}

function sendJSON(res: ServerResponse, status: number, data: any) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

async function readJSON(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhoneBR(raw: string): string {
  const digits = onlyNumbers(raw);
  if (!digits) return '';
  // Se já vier com DDI 55
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }
  // Se vier com DDD+numero (10 ou 11 dígitos)
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  // fallback: se tiver 13 dígitos sem + e não começa com 55, retorna com +
  if (digits.length > 0 && digits[0] !== '+') {
    return `+${digits}`;
  }
  return raw;
}

async function getSessionMetrics(sessionName: string) {
  const db = getClientDB(sessionName);
  let executed_cmds = 0;
  let started_at: string | null = null;
  let users_total = 0;
  let groups_total = 0;
  let xp_events_total = 0;

  try {
    const [botRows] = await db.query('SELECT executed_cmds, started FROM bot LIMIT 1');
    const bot = Array.isArray(botRows) ? (botRows as any[])[0] : undefined;
    executed_cmds = Number(bot?.executed_cmds ?? 0);
    if (bot?.started) {
      const d = new Date(bot.started);
      started_at = isNaN(d.getTime()) ? null : d.toISOString();
    } else {
      started_at = null;
    }
  } catch {}

  try {
    const [userRows] = await db.query('SELECT COUNT(*) as count FROM users');
    const count = Array.isArray(userRows) ? ((userRows as any[])[0]?.count ?? 0) : 0;
    users_total = Number(count);
  } catch {}

  try {
    const [groupRows] = await db.query('SELECT COUNT(*) as count FROM grupos');
    const count = Array.isArray(groupRows) ? ((groupRows as any[])[0]?.count ?? 0) : 0;
    groups_total = Number(count);
  } catch {}

  try {
    const [xpRows] = await db.query('SELECT COUNT(*) as count FROM xp_events');
    const count = Array.isArray(xpRows) ? ((xpRows as any[])[0]?.count ?? 0) : 0;
    xp_events_total = Number(count);
  } catch {}

  const xpReset = XPService.getNextResetDate();

  return {
    session_name: sessionName,
    executed_cmds,
    started_at,
    users_total,
    groups_total,
    xp_events_total,
    xp_next_reset: xpReset.toISOString(),
    generated_at: new Date().toISOString(),
  };
}

async function getXPLeaderboardData(sessionName: string, period: XPPeriod, limit: number) {
  await XPService.init(sessionName);
  const db = getClientDB(sessionName);
  const normalizedLimit = Math.min(100, Math.max(1, limit || 10));
  let where = '';
  if (period === 'semanal') {
    where = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
  } else if (period === 'mensal') {
    where = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
  }

  const [rows] = (await db.query(
    `
      SELECT user_id, SUM(amount) AS total
      FROM xp_events
      ${where}
      GROUP BY user_id
      ORDER BY total DESC
      LIMIT ?
    `,
    { replacements: [normalizedLimit] },
  )) as [Array<{ user_id: string; total: number }>, unknown];

  const leaderboardRows = Array.isArray(rows) ? rows : [];
  const userIds = leaderboardRows.map((r) => r.user_id).filter(Boolean);
  const namesMap = new Map<string, string | null>();

  if (userIds.length) {
    const [nameRows] = (await db.query(
      `SELECT id_usuario, nome FROM users WHERE id_usuario IN (?)`,
      { replacements: [userIds] },
    )) as [Array<{ id_usuario: string; nome: string | null }>, unknown];
    for (const row of nameRows ?? []) {
      namesMap.set(row.id_usuario, row.nome ?? null);
    }
  }

  return leaderboardRows.map((row, index) => ({
    position: index + 1,
    user_id: row.user_id,
    total: Number(row.total) || 0,
    name: namesMap.get(row.user_id) ?? null,
  }));
}

// JWT minimal (HS256)
function base64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJWT(payload: any, expiresSec = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresSec };
  const secret = process.env.JWT_SECRET || 'devsecret';
  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(body));
  const data = `${encHeader}.${encPayload}`;
  const sig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${sig}`;
}

function verifyJWT(token?: string): {
  ok: boolean;
  phone?: string;
  role?: string;
  email?: string;
  userId?: number;
  error?: string;
} {
  try {
    if (!token) return { ok: false, error: 'Missing token' };
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return { ok: false, error: 'Malformed token' };
    const secret = process.env.JWT_SECRET || 'devsecret';
    const data = `${h}.${p}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    if (expected !== s) return { ok: false, error: 'Invalid signature' };
    const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false, error: 'Token expired' };
    }
    return {
      ok: true,
      phone: payload.phone,
      role: payload.role,
      email: payload.email,
      userId: payload.userId,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Invalid token' };
  }
}

function getAuthUser(req: IncomingMessage): {
  ok: boolean;
  email?: string;
  userId?: number;
  role?: string;
  error?: string;
} {
  const auth = req.headers['authorization'];
  if (!auth) return { ok: false, error: 'Missing Authorization header' };
  const [type, token] = String(auth).split(' ');
  if (type !== 'Bearer' || !token) return { ok: false, error: 'Invalid Authorization format' };
  const res = verifyJWT(token);
  if (!res.ok) return { ok: false, error: res.error };
  if (res.role !== 'user') return { ok: false, error: 'Forbidden' };
  return { ok: true, email: res.email, userId: res.userId, role: res.role };
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const { pathname, query } = parseUrl(req.url || '', true);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  try {
    // Registro por e-mail/senha
    if (req.method === 'POST' && pathname === '/api/auth/register') {
      return sendJSON(res, 403, { error: 'Cadastro desativado. Use o acesso do administrador.' });
    }

    // Login por e-mail/senha
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const { email, password } = await readJSON(req);
      if (!email || !password)
        return sendJSON(res, 400, { error: 'email e password são obrigatórios' });
      const emailNorm = String(email).trim().toLowerCase();
      if (emailNorm !== OWNER_EMAIL) {
        return sendJSON(res, 401, { error: 'Credenciais inválidas' });
      }
      const user = await AppUser.findOne({ where: { email: emailNorm } });
      if (!user) return sendJSON(res, 401, { error: 'Credenciais inválidas' });
      const { default: bcrypt } = await import('bcryptjs');
      const ok = await bcrypt.compare(String(password), (user as any).password_hash || '');
      if (!ok) return sendJSON(res, 401, { error: 'Credenciais inválidas' });
      const token = signJWT({ role: 'user', userId: (user as any).id, email: emailNorm });
      return sendJSON(res, 200, { ok: true, token });
    }

    // Login do administrador (uso próprio)
    if (req.method === 'POST' && pathname === '/api/auth/admin-login') {
      const { username, password } = await readJSON(req);
      const u = process.env.ADMIN_USERNAME || 'admin';
      const p = process.env.ADMIN_PASSWORD || 'admin';
      if (username === u && password === p) {
        const token = signJWT({ role: 'admin' });
        return sendJSON(res, 200, { ok: true, token });
      }
      return sendJSON(res, 401, { error: 'Credenciais inválidas' });
    }

    // Info do token atual
    if (req.method === 'GET' && pathname === '/api/auth/me') {
      const authHeader = req.headers['authorization'];
      if (!authHeader) return sendJSON(res, 200, { ok: false });
      const [type, token] = String(authHeader).split(' ');
      if (type !== 'Bearer' || !token) return sendJSON(res, 200, { ok: false });
      const v = verifyJWT(token);
      if (!v.ok) return sendJSON(res, 200, { ok: false });
      return sendJSON(res, 200, {
        ok: true,
        role: v.role || null,
        phone: v.phone || null,
        email: v.email || null,
        userId: v.userId || null,
      });
    }

    if (req.method === 'POST' && pathname === '/api/auth/request-otp') {
      return sendJSON(res, 403, { error: 'Login por OTP desativado.' });
    }

    if (req.method === 'POST' && pathname === '/api/auth/verify-otp') {
      return sendJSON(res, 403, { error: 'Login por OTP desativado.' });
    }

    // Listar sessões (licenças) + status em memória
    if (req.method === 'GET' && pathname === '/api/sessions') {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      // lista apenas as sessões do usuário logado
      const rows = (await BotLicense.findAll({
        where: { owner_user_id: auth.userId },
        raw: true,
      })) as any[];
      const customerIds = Array.from(
        new Set(rows.map((r) => r.customer_id).filter((id) => id != null)),
      ) as number[];
      const customers = customerIds.length
        ? await Customer.findAll({ where: { id: customerIds }, raw: true })
        : [];
      const customerMap = new Map(customers.map((c: any) => [c.id, c]));

      const items = rows.map((r: any) => ({
        session_name: r.session_name,
        plan: r.plan,
        status: r.status,
        expires_at: r.session_name === OWNER_SESSION_NAME ? null : r.expires_at,
        runtime: getSessionInfo(r.session_name) || null,
        connected: !!getSocket(r.session_name),
        is_owner_session: r.session_name === OWNER_SESSION_NAME,
        customer: r.customer_id ? (customerMap.get(r.customer_id) ?? null) : null,
      }));
      return sendJSON(res, 200, { ok: true, items });
    }

    // Criar sessão (apenas prepara DB e trial)
    if (req.method === 'POST' && pathname === '/api/sessions') {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const { sessionName } = await readJSON(req);
      if (!sessionName || typeof sessionName !== 'string') {
        return sendJSON(res, 400, { error: 'sessionName é obrigatório' });
      }
      await createTrialIfNotExists(sessionName, auth.userId);
      setSessionStatus(sessionName, 'created');
      await logSessionEvent(sessionName, 'info', 'Sessão criada', { by: auth.userId });
      return sendJSON(res, 200, { ok: true, sessionName });
    }

    // Métricas da sessão
    if (
      req.method === 'GET' &&
      pathname?.startsWith('/api/sessions/') &&
      pathname?.endsWith('/metrics')
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      if (!sessionName) return sendJSON(res, 400, { error: 'sessionName inválido' });

      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });

      const dbName = (lic as any).db_name || sessionName;
      const metrics = await getSessionMetrics(dbName);
      return sendJSON(res, 200, { ok: true, metrics });
    }

    // Ranking de XP
    if (
      req.method === 'GET' &&
      pathname?.startsWith('/api/sessions/') &&
      pathname?.endsWith('/xp/leaderboard')
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      if (!sessionName) return sendJSON(res, 400, { error: 'sessionName inválido' });

      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });

      const periodParam =
        typeof (query as any)?.period === 'string' ? (query as any).period.toLowerCase() : 'mensal';
      const periodMap: Record<string, XPPeriod> = {
        mensal: 'mensal',
        monthly: 'mensal',
        m: 'mensal',
        semanal: 'semanal',
        weekly: 'semanal',
        s: 'semanal',
        geral: 'geral',
        global: 'geral',
        all: 'geral',
        g: 'geral',
      };
      const period: XPPeriod = periodMap[periodParam] || 'mensal';
      const limitParam = Number((query as any)?.limit ?? 15);
      const limit = Number.isFinite(limitParam) ? limitParam : 15;
      const dbName = (lic as any).db_name || sessionName;
      const leaderboard = await getXPLeaderboardData(dbName, period, limit);
      const nextReset = XPService.getNextResetDate().toISOString();
      return sendJSON(res, 200, { ok: true, leaderboard, period, next_reset: nextReset });
    }

    if (req.method === 'GET' && pathname === '/api/xp/config') {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const config = await getXpConfig();
      return sendJSON(res, 200, { ok: true, config });
    }

    if (req.method === 'POST' && pathname === '/api/xp/config') {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const body = await readJSON(req);
      try {
        const saved = await updateXpConfig(body);
        return sendJSON(res, 200, { ok: true, config: saved });
      } catch (error: any) {
        return sendJSON(res, 400, { error: error?.message || 'Configuração inválida' });
      }
    }

    if (req.method === 'DELETE' && pathname === '/api/xp/config') {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const body = await readJSON(req);
      const { nameTier } = body;

      try {
        await deleteTier(nameTier);
        return sendJSON(res, 200, { ok: true });
      } catch (error: any) {
        return sendJSON(res, 400, { error: error?.message || 'Erro ao resetar XP' });
      }
    }

    // Iniciar sessão (gera QR via eventos)
    if (
      req.method === 'POST' &&
      pathname?.startsWith('/api/sessions/') &&
      pathname?.endsWith('/start')
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      if (!sessionName) return sendJSON(res, 400, { error: 'sessionName inválido' });

      // verifica se a sessão pertence ao usuário
      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });

      let body: any = {};
      try {
        body = await readJSON(req);
      } catch {
        body = {};
      }
      const loginMethodRaw = String(body?.loginMethod || '').toLowerCase();
      const isCode = loginMethodRaw === 'code' || loginMethodRaw === '1';
      const phoneRaw = body?.phoneNumber ?? body?.phone ?? null;
      let normalizedPhone: string | undefined;
      if (isCode) {
        normalizedPhone = onlyNumbers(String(phoneRaw || ''));
        if (!normalizedPhone) {
          return sendJSON(res, 400, { error: 'Informe o telefone (com DDD) para gerar o código.' });
        }
      }

      const sequelize = await prepareSessionDatabase(sessionName);
      setSessionStatus(sessionName, 'starting');
      connectWhatsapp(sessionName, sequelize, {
        loginMethod: isCode ? 1 : 2,
        phoneNumber: normalizedPhone,
      }).catch((e) => {
        console.error('Erro ao iniciar sessão:', sessionName, e);
      });
      await logSessionEvent(sessionName, 'info', 'Sessão iniciada', { by: auth.userId });
      return sendJSON(res, 200, { ok: true, sessionName });
    }

    // Parar sessão
    if (
      req.method === 'POST' &&
      pathname?.startsWith('/api/sessions/') &&
      pathname?.endsWith('/stop')
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      if (!sessionName) return sendJSON(res, 400, { error: 'sessionName inválido' });
      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });
      const ok = await stopSession(sessionName);
      setSessionStatus(sessionName, ok ? 'stopped' : 'closed');
      await logSessionEvent(sessionName, 'info', 'Sessão parada', { by: auth.userId, success: ok });
      return sendJSON(res, 200, { ok: true, sessionName });
    }

    // Logout (apaga credenciais e força novo pareamento)
    if (
      req.method === 'POST' &&
      pathname?.startsWith('/api/sessions/') &&
      pathname?.endsWith('/logout')
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      if (!sessionName) return sendJSON(res, 400, { error: 'sessionName inválido' });

      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });

      // encerra conexão atual, se houver
      await stopSession(sessionName);

      // garante conexão com DB da sessão e remove credenciais
      await prepareSessionDatabase(sessionName);
      await BaileysSession.destroy({ where: { session_name: sessionName } });

      // limpa status/QR em memória
      setSessionStatus(sessionName, 'closed');
      setSessionQr(sessionName, undefined);
      await logSessionEvent(sessionName, 'info', 'Credenciais removidas', { by: auth.userId });

      return sendJSON(res, 200, { ok: true, sessionName });
    }

    // Adicionar dias à licença
    if (
      req.method === 'POST' &&
      pathname?.startsWith('/api/sessions/') &&
      pathname?.endsWith('/extend')
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      if (!sessionName) return sendJSON(res, 400, { error: 'sessionName inválido' });
      const { days } = await readJSON(req);
      const addDays = Number(days);
      if (!Number.isFinite(addDays) || addDays <= 0) {
        return sendJSON(res, 400, { error: 'Informe a quantidade de dias (número positivo).' });
      }
      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });
      if (sessionName === OWNER_SESSION_NAME) {
        return sendJSON(res, 400, { error: 'A sessão do administrador não possui validade.' });
      }
      const now = new Date();
      const base = lic.expires_at && lic.expires_at > now ? lic.expires_at : now;
      const newExpires = new Date(base.getTime() + addDays * MS_IN_DAY);
      await lic.update({ expires_at: newExpires, status: 'active' });
      await logSessionEvent(sessionName, 'info', 'Licença estendida', {
        by: auth.userId,
        days: addDays,
        new_expiration: newExpires.toISOString(),
      });
      return sendJSON(res, 200, { ok: true, sessionName, expires_at: newExpires.toISOString() });
    }

    // Status da sessão
    if (
      req.method === 'GET' &&
      pathname?.startsWith('/api/sessions/') &&
      pathname?.endsWith('/status')
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });
      const info = getSessionInfo(sessionName || '');
      return sendJSON(res, 200, { ok: true, sessionName, info });
    }

    // QR da sessão (string)
    if (
      req.method === 'GET' &&
      pathname?.startsWith('/api/sessions/') &&
      pathname?.endsWith('/qr')
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });
      const info = getSessionInfo(sessionName || '');
      return sendJSON(res, 200, {
        ok: true,
        sessionName,
        qr: info?.qr,
        pairing_code: info?.pairingCode ?? null,
      });
    }

    // Reset manual do XP
    if (
      req.method === 'POST' &&
      pathname?.startsWith('/api/sessions/') &&
      pathname?.endsWith('/xp/reset')
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      if (!sessionName) return sendJSON(res, 400, { error: 'sessionName inválido' });
      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });
      const dbName = (lic as any).db_name || sessionName;
      await XPService.resetAll(dbName);
      await logSessionEvent(sessionName, 'warn', 'XP reiniciado manualmente', { by: auth.userId });
      return sendJSON(res, 200, { ok: true, sessionName });
    }

    // Remover sessão (drop schema + remover licença)
    if (req.method === 'DELETE' && pathname?.startsWith('/api/sessions/')) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      if (!sessionName) return sendJSON(res, 400, { error: 'sessionName inválido' });

      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });

      // encerra e limpa runtime
      await stopSession(sessionName);
      resetSession(sessionName);

      // remove schema do cliente
      await dropSessionDatabase(sessionName);

      // remove licença
      await BotLicense.destroy({ where: { session_name: sessionName } });
      await logSessionEvent(sessionName, 'warn', 'Sessão removida', { by: auth.userId });

      return sendJSON(res, 200, { ok: true, sessionName });
    }

    if (req.method === 'GET' && pathname === '/api/logs') {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionFilter =
        typeof (query as any)?.session === 'string' ? (query as any).session : undefined;
      const limit = Math.min(200, Math.max(1, Number((query as any)?.limit ?? 50)));
      const where: any = {};
      if (sessionFilter) where.session_name = sessionFilter;
      const logs = await SessionLog.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        raw: true,
      });
      return sendJSON(res, 200, { ok: true, logs });
    }
    if (req.method === 'POST' && pathname === '/api/logs/clear') {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const { sessionName } = await readJSON(req);
      const where: any = {};
      if (sessionName) {
        const lic = await BotLicense.findOne({
          where: { session_name: sessionName, owner_user_id: auth.userId },
        });
        if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });
        where.session_name = sessionName;
      }
      await SessionLog.destroy({ where });
      return sendJSON(res, 200, { ok: true });
    }

    if (req.method === 'GET' && pathname === '/api/customers') {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const customers = await Customer.findAll({ order: [['created_at', 'DESC']], raw: true });
      return sendJSON(res, 200, { ok: true, customers });
    }

    if (req.method === 'POST' && pathname === '/api/customers') {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const { name, email, phone, company, notes } = await readJSON(req);
      if (!name || typeof name !== 'string') {
        return sendJSON(res, 400, { error: 'name é obrigatório' });
      }
      const customer = await Customer.create({ name, email, phone, company, notes });
      return sendJSON(res, 200, { ok: true, customer });
    }

    if (
      req.method === 'PUT' &&
      pathname?.startsWith('/api/customers/') &&
      pathname.split('/').length === 4
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const id = Number(pathname.split('/')[3]);
      if (!Number.isFinite(id)) return sendJSON(res, 400, { error: 'ID inválido' });
      const customer = await Customer.findByPk(id);
      if (!customer) return sendJSON(res, 404, { error: 'Cliente não encontrado' });
      const { name, email, phone, company, notes } = await readJSON(req);
      await customer.update({ name, email, phone, company, notes });
      return sendJSON(res, 200, { ok: true, customer });
    }

    if (
      req.method === 'DELETE' &&
      pathname?.startsWith('/api/customers/') &&
      pathname.split('/').length === 4
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const id = Number(pathname.split('/')[3]);
      if (!Number.isFinite(id)) return sendJSON(res, 400, { error: 'ID inválido' });
      const inUse = await BotLicense.count({ where: { customer_id: id } });
      if (inUse > 0) {
        return sendJSON(res, 400, {
          error: 'Cliente vinculado a sessões, remova os vínculos antes.',
        });
      }
      await Customer.destroy({ where: { id } });
      return sendJSON(res, 200, { ok: true });
    }

    if (
      req.method === 'POST' &&
      pathname?.startsWith('/api/sessions/') &&
      pathname?.endsWith('/customer')
    ) {
      const auth = getAuthUser(req);
      if (!auth.ok) return sendJSON(res, 401, { error: auth.error });
      const sessionName = pathname.split('/')[3];
      if (!sessionName) return sendJSON(res, 400, { error: 'sessionName inválido' });
      const { customerId } = await readJSON(req);
      const lic = await BotLicense.findOne({
        where: { session_name: sessionName, owner_user_id: auth.userId },
      });
      if (!lic) return sendJSON(res, 404, { error: 'Sessão não encontrada' });
      let customer: Customer | null = null;
      if (customerId) {
        customer = await Customer.findByPk(customerId);
        if (!customer) return sendJSON(res, 404, { error: 'Cliente não encontrado' });
      }
      await lic.update({ customer_id: customer ? customer.id : null });
      await logSessionEvent(sessionName, 'info', 'Cliente atualizado', {
        by: auth.userId,
        customer_id: customer?.id ?? null,
      });
      return sendJSON(res, 200, { ok: true });
    }

    // Endpoint de health
    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJSON(res, 200, { ok: true });
    }

    sendJSON(res, 404, { error: 'Not Found' });
  } catch (err: any) {
    console.error(err);
    sendJSON(res, 500, { error: 'Internal Server Error', details: err?.message });
  }
}

export async function startApiServer(port = Number(process.env.PORT) || 4000, host = '127.0.0.1') {
  await initDB();
  await ensureXpConfigLoaded();
  const server = http.createServer(handleRequest);
  server.listen(port, host, () => {
    console.log(`[API] Servidor iniciado em http://localhost:${port}`);
  });
}

// Permite executar diretamente
if (process.argv[1]?.endsWith('server.js')) {
  startApiServer().catch((e) => {
    console.error('Erro ao iniciar API:', e);
    process.exit(1);
  });
}
