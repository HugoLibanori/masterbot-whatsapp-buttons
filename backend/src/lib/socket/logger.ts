import * as types from '../../types/BaileysTypes/index.js';

export function logger(sock: types.MyWASocket): types.MyLogger {
  return sock.logger;
}
