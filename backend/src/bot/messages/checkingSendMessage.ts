import * as types from '../../types/BaileysTypes/index.js';
import { ISocket } from '../../types/MyTypes/index.js';
import { Bot, MessageContent } from '../../interfaces/index.js';
import * as userController from '../controllers/UserController.js';
import * as grupoController from '../controllers/GrupoController.js';
import * as botController from '../controllers/BotController.js';
import { commandInfo } from './messagesObj.js';
import { createText, checkCommandExists } from '../../utils/utils.js';
import { typeMessages } from './contentMessage.js';
import { avisoLimiteDiarioCache } from '../../utils/caches.js';

export const checkingSendMessage = async (
  sock: ISocket,
  message: types.MyWAMessage,
  messageContent: MessageContent,
  dataBot: Partial<Bot>,
): Promise<boolean> => {
  const {
    sender,
    pushName,
    command,
    isGroup,
    grupo,
    type,
    id_chat,
    isOwnerBot,
    textReceived,
    senderLid,
  } = messageContent;
  const { dataBd, id_group, isAdmin, isBotAdmin } = { ...grupo };
  const { autosticker } = dataBd;
  const { prefix } = dataBot;

  if (!sender && !senderLid) return false;
  
  // Se o sender estiver vazio mas tivermos o LID, vamos usar o LID como identificador principal
  const userId = sender || senderLid;

  const commandsInfo = commandInfo();
  const numberOwner = await userController.getOwner();
  const existCommands = await checkCommandExists(dataBot, command);
  const usersBlock = await sock.getBlockedContacts();
  const userBlock = usersBlock.includes(sender!);
  const msgGuia = textReceived === 'guia';

  const autostickerpv =
    !isGroup && (type === typeMessages.IMAGE || type === typeMessages.VIDEO) && dataBot.autosticker;
  const autostickergp =
    isGroup && (type === typeMessages.IMAGE || type === typeMessages.VIDEO) && autosticker;

  try {
    //SE O PV DO BOT NÃO ESTIVER LIBERADO
    const isTester = (dataBot.testers || []).includes(userId!);
    if (!isGroup && !isOwnerBot && !isTester && !dataBot.commands_pv) return false;

    //SE O GRUPO DO BOT NÃO ESTIVER LIBERADO
    if (isGroup && !isOwnerBot && !dataBot.commands_gp) return false;

    // VERIFICANDO SE O USUARIO EXISTE E SE NÃO EXISTIR FAÇA O CADASTRO.
    let dataUser = await userController.getUser(userId!);
    const isLid = userId?.endsWith('@lid');
    const isNumber = userId?.startsWith('55');

    if (!dataUser && (isNumber || isLid)) {
      await userController.registerUser(userId, senderLid || '', pushName!);
      dataUser = await userController.getUser(userId!);
    }

    // VERIFICANDO SE LID FOI CADASTRADO, SE NÃO FOI, CADASTRE
    if (!dataUser?.id_lid && (isNumber || isLid) && senderLid) {
      await userController.updateLid(userId, senderLid || userId);
    }

    // SE NÃO HOUVER UM USUARIO DO TIPO 'DONO' E O COMANDO FOR !ADMIN, ALTERE O TIPO DE QUEM FEZ O COMANDO COMO DONO.
    if ((!numberOwner || numberOwner === 'Sem dono') && command === `${prefix}admin`) {
      await userController.registerOwner(userId!);
      await sock.replyText(id_chat, commandsInfo.outros.dono_cadastrado, message);
      return false;
    }

    // SE O CONTADOR TIVER ATIVADO E FOR UMA MENSAGEM DE GRUPO, VERIFICA SE O USUARIO EXISTE NO CONTADOR , REGISTRA ELE E ADICIONA A CONTAGEM
    if (isGroup && dataBd?.contador?.status) {
      if (!userId || !id_group || !type) return false;
      await grupoController.checkRegisterCountParticipant(id_group, userId);
      await grupoController.addParticipantCount(id_group, userId, type);
    }

    // VERIFICANDO SE O USUARIO JA TEM 3 ADVERTENCIAS E EXPULSANDO
    const advertencias = dataUser?.advertencia ?? 0;
    if (isGroup && advertencias >= 3 && !isAdmin) {
      await sock.removerParticipant(id_group, userId!);
      await userController.resetWarn(userId!);
      return false;
    }

    // SE FOR BLOQUEADO RETORNE
    if (userBlock) return false;
    // SE O GRUPO ESTIVER COM O RECURSO 'MUTADO' LIGADO E USUARIO NÃO FOR ADMINISTRADOR
    if (isGroup && !isAdmin && dataBd?.mutar) return false;
    // SE FOR MENSAGEM DE GRUPO, O BOT NÃO FOR ADMIN E ESTIVER COM RESTRIÇÃO DE MENSAGENS PARA ADMINS
    if (isGroup && !isBotAdmin && dataBd?.restrito_msg) return false;

    // ATUALIZE NOME DO USUÁRIO SE TIVER MUDADO
    if (pushName && dataUser && dataUser.nome !== pushName) {
      await userController.updateName(userId!, pushName);
    }

    // VERIFICANDO EXPIRAÇÃO DO PLANO ATIVO DO USUÁRIO
    if (dataUser?.plano_ativo && dataUser?.expira_em) {
      await userController.checkUserExpiration(userId!);
    }

    // VERIFICANDO SE O GRUPO POSSUI PLANO ATIVO (ACESSO ILIMITADO PARA TODOS OS MEMBROS DO GRUPO)
    const isGroupPlanActive = isGroup && id_group ? await grupoController.checkGroupPlanExpiration(id_group) : false;

    if (existCommands.exists || autostickerpv || autostickergp) {
      // Marcar como lida somente quando vamos responder/agir
      await sock.readMessage(message.key);

      if (dataBot?.command_rate?.status) {
        const tipoEfetivo = isGroupPlanActive ? 'vip' : (dataUser?.tipo ?? 'comum');
        let limiteComando = await botController.checkLimitCommand(
          userId!,
          tipoEfetivo,
          isAdmin,
          dataBot,
        );
        if (limiteComando.comando_bloqueado) {
          if (limiteComando.msg != undefined)
            await sock.replyText(id_chat, limiteComando.msg, message);
          return false;
        }
      }
      //BLOQUEIO GLOBAL DE COMANDOS
      if ((await botController.checkBlockedCommandsGlobal(command, dataBot)) && !isOwnerBot) {
        await sock.replyText(
          id_chat,
          createText(commandsInfo.admin.bcmdglobal.msgs.resposta_cmd_bloqueado, command),
          message,
        );
        return false;
      }
      //SE FOR MENSAGEM DE GRUPO , COMANDO ESTIVER BLOQUEADO E O USUARIO NAO FOR ADMINISTRADOR DO GRUPO
      if (
        isGroup &&
        (await grupoController.verificarComandosBloqueadosGrupo(command, grupo)) &&
        !isAdmin
      ) {
        await sock.replyText(
          id_chat,
          createText(commandsInfo.grupo.bcmd.msgs.resposta_cmd_bloqueado, command),
          message,
        );
        return false;
      }
      //SE O RECURSO DE LIMITADOR DIARIO DE COMANDOS ESTIVER ATIVADO E O COMANDO NÃO ESTIVER NA LISTA DE EXCEÇÔES/INFO/GRUPO/ADMIN
      // Se o grupo tem plano ativo liberado, membros no grupo têm comandos ilimitados!
      if (dataBot.limite_diario?.status && !isGroupPlanActive) {
        await botController.checkExpirationLimit(dataBot);
        if ((existCommands.exists && !msgGuia) || autostickerpv || autostickergp) {
          let ultrapassou = await userController.verificarUltrapassouLimiteComandos(
            userId!,
            dataBot,
          );
          if (!ultrapassou) {
            await userController.addContagemDiaria(userId!);
          } else {
            if (!avisoLimiteDiarioCache.get(userId!)) {
              avisoLimiteDiarioCache.set(userId!, true);
              await sock.sendTextWithMentions(
                id_chat,
                createText(
                  commandsInfo.admin.limitediario.msgs.resposta_excedeu_limite,
                  pushName ?? 'Sem nome!',
                  numberOwner.replace('@s.whatsapp.net', ''),
                ),
                [numberOwner],
              );
            }
            return false;
          }
        } else {
          await userController.addContagemTotal(userId!);
        }
      } else {
        await userController.addContagemTotal(userId!);
      }
      //ADICIONA A CONTAGEM DE COMANDOS EXECUTADOS PELO BOT
      await botController.updateCommands();
    }

    return true;
  } catch (error) {
    return false;
  }
};
