import * as types from '../types/BaileysTypes/index.js';

import { ISocket } from '../types/MyTypes/index.js';
import * as botController from '../bot/controllers/BotController.js';
import * as grupoController from '../bot/controllers/GrupoController.js';
import { Bot } from '../interfaces/index.js';
import { convertGroupMetadataToGrupo } from '../lib/convert.js';
import { commandInfo } from '../bot/messages/messagesObj.js';
import { consoleErro, textColor, createText, nameBotLog } from '../utils/utils.js';
import { updateGroupCacheParam, groupCache } from '../utils/caches.js';

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
      // REGISTRAR TODOS OS GRUPOS
      await grupoController.registerGroupsInital(this.groupInfo);

      const gruposConvertidos = await Promise.all(
        this.groupInfo.map((g) => convertGroupMetadataToGrupo(g, this.sock)),
      );
      // ATUALIZAR DADOS DOS GRUPOS
      await grupoController.updateGroups(gruposConvertidos);
      //VERIFICAR LISTA NEGRA
      await grupoController.verifiedBlackList(this.sock, this.groupInfo, this.botInfo);
      // LOG GRUPOS CARREGADOS COM SUCESSO
      console.log('[GRUPOS]', textColor(commandInfo().outros.grupos_carregados));

      //LOG SERVIDOR INICIADO COM SUCESSO
      console.log('[SERVIDOR]', textColor(commandInfo().outros.servidor_iniciado));

      // LOG NOME BOT
      nameBotLog();
    } catch (err: any) {
      consoleErro(err, 'GROUPS.UPDATE');
    }
    return true;
  }

  async updateParticipants(event: {
    id: string;
    author: string;
    participants: string[];
    action: types.MyParticipantActions;
  }) {
    try {
      const g_info = await grupoController.getGroup(event.id);
      const isBotUpdate = event.participants[0] === this.botInfo.number_bot;
      const participantId = event.participants[0];

      let groupInCache: types.MyGroupMetadata | undefined = groupCache.get(event.id);

      if (event.action === 'add') {
        // LISTA NEGRA
        if (!(await grupoController.verificarListaNegraUsuario(this.sock, event, this.botInfo)))
          return;
        // ANTI-FAKE
        if (!(await grupoController.filterAntiFake(this.sock, event, this.botInfo))) return;
        // BEM-VINDO
        await grupoController.welcomeMessage(this.sock, event, this.botInfo);
        // CONTADOR
        if (g_info?.contador.status) {
          await grupoController.verificarRegistrarContagemParticipante(event.id, participantId);
        }
        // Banco
        await grupoController.addParticipant(participantId, event.id);

        // Cache
        if (groupInCache) {
          const exists = groupInCache.participants.some((p) => p.id === participantId);
          if (!exists) {
            groupInCache.participants.push({ id: participantId, admin: null });
            groupCache.set(event.id, groupInCache);
          }
        }
      } else if (event.action === 'remove') {
        if (isBotUpdate) {
          if (g_info?.contador.status) await grupoController.removeCountGroup(event.id);
          await grupoController.removeGroupVerified(event.id);
          await grupoController.removeGroupBd(event.id);
          groupCache.del(event.id);
          return;
        }
        // Banco
        await grupoController.removeParticipant(participantId, event.id);

        // Cache
        if (groupInCache) {
          groupInCache.participants = groupInCache.participants.filter(
            (p) => p.id !== participantId,
          );
          groupCache.set(event.id, groupInCache);
        }
      } else if (event.action === 'promote') {
        // Banco
        await grupoController.addAdmin(participantId, event.id);

        // Cache
        if (groupInCache) {
          const p = groupInCache.participants.find((p) => p.id === participantId);
          if (p) p.admin = 'admin';
          groupCache.set(event.id, groupInCache);
        }
      } else if (event.action === 'demote') {
        // Banco
        await grupoController.removeAdmin(participantId, event.id);

        // Cache
        if (groupInCache) {
          const p = groupInCache.participants.find((p) => p.id === participantId);
          if (p) p.admin = null;
          groupCache.set(event.id, groupInCache);
        }
      }
    } catch (err: any) {
      consoleErro(err, 'GROUPS.UPDATE');
    }
  }

  async adicionadoEmGrupo(socket: ISocket, dadosGrupo: types.MyGroupMetadata[]) {
    try {
      const comandos_info = commandInfo();
      await grupoController.registerGroupsInital(dadosGrupo);
      await socket
        .sendText(
          dadosGrupo[0].id,
          createText(comandos_info.outros.entrada_grupo, dadosGrupo[0].subject),
        )
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
          await grupoController.updateNomeVerificado(g.id, g.subject);
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
