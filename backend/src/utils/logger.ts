import chalk from 'chalk';
import SessionLog from '../database/models/SessionLog.js';

export class Logger {
  static async info(session: string, message: string, meta: any = null) {
    // Log no Terminal (estilo PM2)
    console.log(`${chalk.gray(`[${session}]`)} ${chalk.blue('INFO:')} ${message}`);

    // Salvar no Banco
    try {
      await SessionLog.create({
        session_name: session,
        level: 'info',
        message: message,
        meta: meta
      });
    } catch (e) {
      console.error('Erro ao salvar log no banco:', e);
    }
  }

  static async command(session: string, command: string, from: string, target: string) {
    const now = new Date();
    const timestamp = `[${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}]`;
    
    const consoleMsg = `${chalk.gray(timestamp)} ${chalk.bold.green('💬 COMANDO:')} ${chalk.cyan(command)} ${chalk.bold.yellow('👤 DE:')} ${chalk.magenta(from)} ${chalk.bold.blue('👥 EM:')} ${chalk.white(target)}`;
    
    console.log(consoleMsg);

    // Salvar no Banco com a mesma formatação (removendo cores do chalk para o banco se preferir, ou mantendo a string limpa)
    const cleanMsg = `💬 COMANDO: ${command} | DE: ${from} | EM: ${target}`;
    
    try {
      await SessionLog.create({
        session_name: session,
        level: 'command',
        message: cleanMsg,
        meta: { command, from, target, timestamp }
      });
    } catch (e) {
      console.error('Erro ao salvar log de comando:', e);
    }
  }

  static async error(session: string, message: string, error: any = null) {
    console.error(`${chalk.red(`[${session}] ERROR:`)} ${message}`, error);

    try {
      await SessionLog.create({
        session_name: session,
        level: 'error',
        message: message,
        meta: { error: error?.toString() }
      });
    } catch (e) {
      console.error('Erro ao salvar log de erro:', e);
    }
  }
}
