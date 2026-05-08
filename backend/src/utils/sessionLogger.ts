import SessionLog from '../database/models/SessionLog.js';

type LogLevel = 'info' | 'warn' | 'error';

export async function logSessionEvent(
  sessionName: string,
  level: LogLevel,
  message: string,
  meta?: Record<string, any>,
) {
  try {
    await SessionLog.create({
      session_name: sessionName,
      level,
      message,
      meta: meta ?? null,
    });
  } catch (err) {
    console.error('[SessionLog] Erro ao registrar log:', err);
  }
}
