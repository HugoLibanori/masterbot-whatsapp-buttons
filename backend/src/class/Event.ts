import * as types from '../types/BaileysTypes/index.js';

import { ISocket } from '../types/MyTypes/index.js';
import * as botController from '../bot/controllers/BotController.js';
import * as grupoController from '../bot/controllers/GrupoController.js';
import { Bot, Grupo } from '../interfaces/index.js';
import { convertGroupMetadataToGrupo } from '../lib/convert.js';
import { commandInfo } from '../bot/messages/messagesObj.js';
import { consoleErro, textColor, createText, nameBotLog } from '../utils/utils.js';
import { updateGroupCacheParam, groupCache } from '../utils/caches.js';
import { getClientDB } from '../database/index.js';
import { XPService } from '../services/XPService.js';
import { schedule } from '../lib/socket/rateLimiter.js';

export class Event {
  declare sock: ISocket;
  declare groupInfo: types.MyGroupMetadata[];
  declare botInfo: Partial<Bot>;
  constructor(sock: ISocket, groupInfo: types.MyGroupMetadata[], botInfo: Partial<Bot>) {
    this.sock = sock;
    this.groupInfo = groupInfo;
    this.botInfo = botInfo;
  }
  async updateDataStart(): Promise<boolean> {
    try {
      // INICIAR DADOS BOT
      await botController.startBot(this.sock, this.botInfo);
      
      const uniqueGroups = Array.from(new Map(this.groupInfo.map((g) => [g.id, g])).values());
      console.log(`[BOOT] Carregando metadados de ${uniqueGroups.length} grupos...`);

      // REGISTRAR TODOS OS GRUPOS
      await grupoController.registerGroupsInital(uniqueGroups);

      // VERIFICAR LISTA NEGRA (Em background para não travar a conexão)
      setImmediate(async () => {
        try {
          for (const grupo of uniqueGroups) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            await grupoController.verifiedBlackList(this.sock, [grupo], this.botInfo);
          }
        } catch {}
      });

      // LOG GRUPOS CARREGADOS COM SUCESSO
      console.log('[GRUPOS]', textColor(commandInfo().outros.grupos_carregados));

      //LOG SERVIDOR INICIADO COM SUCESSO
      console.log('[SERVIDOR]', textColor(commandInfo().outros.servidor_iniciado));

      // LOG NOME BOT
      nameBotLog(this.sock.session_name);
    } catch (err: any) {
      consoleErro(err, 'GROUPS.UPDATE');
    }
    return true;
  }

  async updateParticipants(event: {
    id: string;
    author: string;
    authorPn?: string;
    participants: any[];
    action: 'add' | 'remove' | 'promote' | 'demote' | 'modify';
  }) {
    try {
      const g_info = await grupoController.getGroup(event.id);
      const isBotUpdate = event?.authorPn === this.botInfo.number_bot;

      const getTargetId = (p: any): string => {
        if (!p) return '';
        if (typeof p === 'string') return p;
        return p.phoneNumber || p.id || '';
      };

      const rawParticipants =
        event.participants && event.participants.length > 0
          ? event.participants
          : [event?.authorPn ? event.authorPn : event.author];

      const participantId = getTargetId(rawParticipants[0]);

      let groupInCache: types.MyGroupMetadata | undefined = groupCache.get(event.id);

      if (event.action === 'add') {
        // LISTA NEGRA
        if (!(await grupoController.verificarListaNegraUsuario(this.sock, event, this.botInfo)))
          return;
        // ANTI-FAKE
        if (!(await grupoController.filterAntiFake(this.sock, event, this.botInfo))) return;
        // BEM-VINDO
        await grupoController.welcomeMessage(this.sock, event, this.botInfo);

        for (const p of rawParticipants) {
          const partId = getTargetId(p);
          if (!partId) continue;

          // CONTADOR
          if (g_info?.contador.status) {
            await grupoController.verificarRegistrarContagemParticipante(event.id, partId);
          }
          // Banco
          await grupoController.addParticipant(partId, event.id);

          // Cache
          if (groupInCache) {
            const exists = groupInCache.participants.some((cp) => cp.id === partId);
            if (!exists) {
              groupInCache.participants.push({ id: partId, admin: null });
              groupCache.set(event.id, groupInCache);
            }
          }

          // XP por adicionar pessoas: apenas no grupo oficial
          const sessionName = this.sock.session_name;
          if (!sessionName) continue;

          const db = getClientDB(sessionName);

          try {
            const isOfficial = this.botInfo.grupo_oficial && event.id === this.botInfo.grupo_oficial;
            const referrer = event.author;

            if (
              isOfficial &&
              referrer &&
              referrer !== partId &&
              referrer !== this.botInfo.number_bot
            ) {
              const qi = db.getQueryInterface();

              // ✅ garante tabela referrals na sessão correta
              try {
                await qi.describeTable('referrals');
              } catch {
                await qi.createTable('referrals', {
                  id: { type: 'BIGINT UNSIGNED', primaryKey: true, autoIncrement: true },
                  referrer_id: { type: 'VARCHAR(255)', allowNull: false },
                  referred_id: { type: 'VARCHAR(255)', allowNull: false, unique: true },
                  status: { type: 'VARCHAR(32)', allowNull: false, defaultValue: 'activated' },
                  created_at: {
                    type: 'DATETIME',
                    allowNull: false,
                    defaultValue: db.literal('CURRENT_TIMESTAMP'),
                  },
                } as any);

                try {
                  await db.query('CREATE UNIQUE INDEX idx_ref_referred ON referrals (referred_id)');
                } catch {}

                try {
                  await db.query('CREATE INDEX idx_ref_referrer ON referrals (referrer_id)');
                } catch {}
              }

              // ✅ verifica se já existe convite
              const [exists] = (await db.query(
                'SELECT id FROM referrals WHERE referred_id = ? LIMIT 1',
                { replacements: [partId] },
              )) as any[];

              if (!exists || !exists.length) {
                await db.query(
                  'INSERT INTO referrals (referrer_id, referred_id, status) VALUES (?, ?, ?)',
                  { replacements: [referrer, partId, 'activated'] },
                );

                // ✅ XP agora também é por sessão
                await XPService.addEvent(sessionName, referrer, 'referral_activated', {
                  referred_id: partId,
                  source: 'group_add',
                  group_id: event.id,
                });
              }
            }
          } catch {}
        }
      } else if (event.action === 'remove') {
        if (isBotUpdate) {
          if (g_info?.contador.status) await grupoController.removeCountGroup(event.id);
          await grupoController.removeGroupBd(event.id);
          groupCache.del(event.id);
          return;
        }

        for (const p of rawParticipants) {
          const partId = getTargetId(p);
          if (!partId) continue;

          // Banco
          await grupoController.removeParticipant(partId, event.id);

          try {
            const sessionName = this.sock.session_name;
            if (sessionName) {
              await XPService.removeUser(sessionName, partId);
            }
          } catch {}

          // Cache
          if (groupInCache) {
            groupInCache.participants = groupInCache.participants.filter(
              (cp) => cp.id !== partId,
            );
            groupCache.set(event.id, groupInCache);
          }
        }
      } else if (event.action === 'promote') {
        for (const p of rawParticipants) {
          const partId = getTargetId(p);
          if (!partId) continue;

          // Banco
          await grupoController.addAdmin(partId, event.id);

          // Cache
          if (groupInCache) {
            const cleanPart = partId.replace(/:\d+@/, '@');
            const partDigits = partId.replace(/\D+/g, '');
            const cp = groupInCache.participants.find(
              (item) =>
                item.id === partId ||
                item.id?.replace(/:\d+@/, '@') === cleanPart ||
                (item as any).lid?.replace(/:\d+@/, '@') === cleanPart ||
                (Boolean(partDigits) && item.id?.replace(/\D+/g, '') === partDigits),
            );
            if (cp) cp.admin = 'admin';
            groupCache.set(event.id, groupInCache);
          }
        }
      } else if (event.action === 'demote') {
        for (const p of rawParticipants) {
          const partId = getTargetId(p);
          if (!partId) continue;

          // Banco
          await grupoController.removeAdmin(partId, event.id);

          // Cache
          if (groupInCache) {
            const cleanPart = partId.replace(/:\d+@/, '@');
            const partDigits = partId.replace(/\D+/g, '');
            const cp = groupInCache.participants.find(
              (item) =>
                item.id === partId ||
                item.id?.replace(/:\d+@/, '@') === cleanPart ||
                (item as any).lid?.replace(/:\d+@/, '@') === cleanPart ||
                (Boolean(partDigits) && item.id?.replace(/\D+/g, '') === partDigits),
            );
            if (cp) cp.admin = null;
            groupCache.set(event.id, groupInCache);
          }
        }
      }
    } catch (err: any) {
      consoleErro(err, 'GROUPS.UPDATE');
    }
  }

  async adicionadoEmGrupo(socket: ISocket, dadosGrupo: types.MyGroupMetadata[]) {
    const prefixBot = this.botInfo.prefix || '!';
    try {
      const comandos_info = commandInfo();
      await grupoController.registerGroupsInital(dadosGrupo);

      // SÓ MANDA MENSAGEM SE OS GRUPOS ESTIVEREM LIBERADOS GLOBALMENTE
      if (!this.botInfo.commands_gp) return;

      await socket
        .sendButtons(dadosGrupo[0].id, {
          text: createText(comandos_info.outros.entrada_grupo, dadosGrupo[0].subject),
          buttons: [{ buttonId: 'added_bot', buttonText: { displayText: `${prefixBot}menu` } }],
        })
        .catch(() => {
          return;
        });
    } catch (err: any) {
      consoleErro(err, 'GROUPS.UPSERT');
    }
  }

  async updateDataGroups(dataGroups: Partial<types.MyGroupMetadata>[]) {
    try {
      for (const g of dataGroups) {
        if (!g.id) return;
        if (g.subject !== undefined) {
          await grupoController.updateNome(g.id, g.subject);
          updateGroupCacheParam(g.id, 'subject', g.subject);
        }
        if (g.desc !== undefined) {
          await grupoController.updateDescricao(g.id, g.desc);
          updateGroupCacheParam(g.id, 'desc', g.desc);
        }
      }
    } catch (err: any) {
      consoleErro(err, 'GROUPS.UPDATE');
    }
  }
}
