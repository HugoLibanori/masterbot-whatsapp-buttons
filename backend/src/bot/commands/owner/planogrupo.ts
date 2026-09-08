import * as types from '../../../types/BaileysTypes/index.js';
import { ISocket } from '../../../types/MyTypes/index.js';
import { CommandReturn, MessageContent, Command, Bot } from '../../../interfaces/index.js';
import * as grupoController from '../../controllers/GrupoController.js';

const command: Command = {
  name: 'planogrupo',
  description: 'Ativa, renova ou desativa o plano mensal liberado para um grupo específico.',
  category: 'owner',
  aliases: ['planogrupo', 'liberargrupo', 'gpplano'],
  group: false,
  admin: false,
  owner: true,
  isBotAdmin: false,

  exec: async (
    sock: ISocket,
    message: types.MyWAMessage,
    messageContent: MessageContent,
    args: string[],
    dataBot: Partial<Bot>,
    textMessage,
  ): Promise<CommandReturn> => {
    const { id_chat, isGroup, grupo } = messageContent;
    const prefix = dataBot.prefix || '!';

    // Se não passou argumentos, mostra o guia de uso
    if (!args || args.length === 0) {
      const helpMsg =
        `👑 *[GERENCIAMENTO DE PLANO DO GRUPO]*\n\n` +
        `Libera comandos ILIMITADOS para TODOS os membros dentro do grupo contratante!\n\n` +
        `📌 *No Grupo:*\n` +
        `• \`${prefix}planogrupo 30\` (Ativa/renova por 30 dias)\n` +
        `• \`${prefix}planogrupo 0\` (Desativa o plano do grupo)\n\n` +
        `📌 *No Privado (PV):*\n` +
        `• \`${prefix}planogrupo <nº do grupo> <dias>\`\n` +
        `_Ex: \`${prefix}planogrupo 1 30\` ativa o grupo 1 da lista de ${prefix}grupos por 30 dias._\n` +
        `_Ex: \`${prefix}planogrupo 1 0\` desativa o plano do grupo 1._`;
      await sock.replyText(id_chat, helpMsg, message);
      return { status: false };
    }

    let targetGroupId: string | null = null;
    let targetGroupName: string = '';
    let dias: number = 0;

    if (isGroup && grupo?.id_group) {
      // Executado dentro de um grupo:
      // args[0] é a quantidade de dias (ou 0 para desativar)
      targetGroupId = grupo.id_group;
      targetGroupName = grupo.dataBd?.nome || 'Grupo Atual';
      const parsedDays = Number(args[0]);
      if (isNaN(parsedDays) || parsedDays < 0) {
        await sock.replyText(
          id_chat,
          `❌ Número de dias inválido!\nExemplo: \`${prefix}planogrupo 30\` ou \`${prefix}planogrupo 0\` para desativar.`,
          message,
        );
        return { status: false };
      }
      dias = parsedDays;
    } else {
      // Executado no PV (ou fornecendo número do grupo e dias)
      const currentGroups = await grupoController.getAllGroups(sock);
      const indexInput = Number(args[0]);

      if (isNaN(indexInput) || indexInput < 1 || indexInput > currentGroups.length) {
        await sock.replyText(
          id_chat,
          `❌ Grupo não encontrado!\nUse \`${prefix}grupos\` para ver a lista numerada dos grupos do bot.\n\n` +
            `Exemplo: \`${prefix}planogrupo 1 30\` (para liberar 30 dias para o grupo 1).`,
          message,
        );
        return { status: false };
      }

      const selectedGroup = currentGroups[indexInput - 1];
      targetGroupId = selectedGroup.id_grupo;
      targetGroupName = selectedGroup.nome;

      const parsedDays = Number(args[1]);
      if (isNaN(parsedDays) || parsedDays < 0) {
        await sock.replyText(
          id_chat,
          `❌ Informe os dias válidos!\nExemplo: \`${prefix}planogrupo ${indexInput} 30\` ou \`${prefix}planogrupo ${indexInput} 0\` para desativar.`,
          message,
        );
        return { status: false };
      }
      dias = parsedDays;
    }

    if (!targetGroupId) {
      await sock.replyText(id_chat, `❌ Não foi possível identificar o grupo alvo.`, message);
      return { status: false };
    }

    try {
      const result = await grupoController.setGroupPlan(targetGroupId, dias);

      if (result.plano_ativo) {
        const expStr = result.expira_em
          ? new Date(result.expira_em).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Indeterminado';

        const resposta =
          `✅ *PLANO DE GRUPO ATIVADO COM SUCESSO!*\n\n` +
          `👥 *Grupo:* ${targetGroupName}\n` +
          `👑 *Status:* Ativo (Ilimitado)\n` +
          `⏳ *Duração adicionada:* ${dias} dia(s)\n` +
          `📆 *Válido até:* ${expStr}\n` +
          `⏱️ *Dias restantes:* ${result.diasRestantes} dia(s)\n\n` +
          `🎉 *Todos os membros deste grupo agora têm comandos ilimitados e sem restrição diária aqui!*`;

        await sock.replyText(id_chat, resposta, message);

        // Se o comando foi enviado do PV, notifica também no grupo alvo
        if (!isGroup && targetGroupId) {
          try {
            await sock.sendText(
              targetGroupId,
              `🌟 *ATENÇÃO: Este grupo teve o plano ativado pelo Administrador!*\n\n` +
                `👑 *Status:* Plano Ativo (${result.diasRestantes} dias restantes)\n` +
                `📆 *Válido até:* ${expStr}\n` +
                `⚡ Todos os participantes agora possuem acesso livre aos comandos neste grupo! Aproveitem! 🚀`,
            );
          } catch {
            // Se falhar o envio no grupo, não impede a resposta
          }
        }
      } else {
        const resposta =
          `🛑 *PLANO DE GRUPO DESATIVADO!*\n\n` +
          `👥 *Grupo:* ${targetGroupName}\n` +
          `⚪ *Status:* Inativo\n\n` +
          `⚠️ Os membros deste grupo voltam a seguir as regras e limites diários comuns.`;

        await sock.replyText(id_chat, resposta, message);
      }

      return { status: true };
    } catch (err: any) {
      console.error('Erro ao gerenciar plano do grupo:', err);
      await sock.replyText(
        id_chat,
        `❌ Ocorreu um erro ao atualizar o plano do grupo: ${err?.message || 'Erro desconhecido'}`,
        message,
      );
      return { status: false };
    }
  },
};

export default command;
