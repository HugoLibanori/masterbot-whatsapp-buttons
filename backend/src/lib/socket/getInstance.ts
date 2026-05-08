import { WASocket } from '@innovatorssoft/baileys';

import * as types from '../../types/BaileysTypes/index.js';

export async function getInstance(sock: types.MyWASocket): Promise<WASocket> {
  return sock;
}
