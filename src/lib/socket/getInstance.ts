import { WASocket } from '@itsukichan/baileys';

import * as types from '../../types/BaileysTypes/index.js';

export async function getInstance(sock: types.MyWASocket): Promise<WASocket> {
  return sock;
}
