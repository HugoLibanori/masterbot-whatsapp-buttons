import * as types from '../../types/BaileysTypes/index.js';
import { ISocket } from '../../types/MyTypes/index.js';
import { Bot, MessageContent } from '../../interfaces/index.js';
import * as userController from '../../bot/controllers/UserController.js';
import * as grupoController from '../../bot/controllers/GrupoController.js';
import * as botController from '../../bot/controllers/BotController.js';
import { commandInfo } from '../../bot/messages/messagesObj.js';
import { createText, checkCommandExists, checkExpirationDate } from '../../utils/utils.js';
import { typeMessages } from '../../bot/messages/contentMessage.js';
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
    if (!isGroup && !isOwnerBot && !dataBot.commands_pv) return false;

    // VERIFICANDO SE O USUARIO EXISTE E SE NÃO EXISTIR FAÇA O CADASTRO.
    const userRegister = await userController.getUser(sender!);
    if (!userRegister && sender?.startsWith('55')) {
      await userController.registerUser(sender, senderLid, pushName!);
    }

    //VERIFICANDO SE LID FOI CADASTRADO, SE NÃO FOI, CADASTRE
    const userLid = await userController.getUserLid(sender!);
    if (!userLid && sender?.startsWith('55')) {
      await userController.updateLid(sender, senderLid!);
    }

    // SE NÃO HOUVER UM USUARIO DO TIPO 'DONO' E O COMANDO FOR !ADMIN, ALTERE O TIPO DE QUEM FEZ O COMANDO COMO DONO.
    if ((!numberOwner || numberOwner === 'Sem dono') && command === `${prefix}admin`) {
      await userController.registerOwner(sender);
      await sock.replyText(id_chat, commandsInfo.outros.dono_cadastrado, message);
      return false;
    }

    //SE O CONTADOR TIVER ATIVADO E FOR UMA MENSAGEM DE GRUPO, VERIFICA SE O USUARIO EXISTE NO CONTADOR , REGISTRA ELE E ADICIONA A CONTAGEM
    if (isGroup && dataBd?.contador?.status) {
      if (!sender || !id_group || !type) return false;
      await grupoController.checkRegisterCountParticipant(id_group, sender);
      await grupoController.addParticipantCount(id_group, sender, type);
    }

    // VERIFICANDO SE O GRUPO É PERMITIDO
    // if (existCommands && isGroup && sender !== numberOwner) {
    //   let grupoVerificado = await grupoController.groupVerified(id_group);
    //   let dataAtual = new Date().toLocaleDateString('pt-br');
    //   let expirado = checkExpirationDate(dataAtual, grupoVerificado?.expiracao ?? '');
    //   if (!grupoVerificado && id_group !== dataBot?.grupo_oficial) {
    //     await sock.replyText(
    //       id_group,
    //       createText(
    //         commandsInfo.grupo.permissao.descricao,
    //         numberOwner.replace('@s.whatsapp.net', ''),
    //       ),
    //       message,
    //     );
    //     return false;
    //   } else if (expirado) {
    //     await sock.replyText(
    //       id_group,
    //       createText(
    //         commandsInfo.grupo.permissao.descricao_expirado,
    //         numberOwner.replace('@s.whatsapp.net', ''),
    //       ),
    //       message,
    //     );
    //     return false;
    //   }
    // }

    // VERIFICANDO SE O USUARIO JA TEM 3 ADVERTENCIAS E EXPULSANDO
    let advertencias = await userController?.getUserWarning(sender);
    if (isGroup && advertencias === 3 && !isAdmin) {
      await sock.removerParticipant(id_group, sender);
      await userController.resetWarn(sender);
      return false;
    }

    // OBTENDO DADOS ATUALIZADOS DO USUÁRIO
    const dataUser = await userController.getUser(sender);

    //SE FOR BLOQUEADO RETORNE
    if (userBlock) return false;
    //SE O GRUPO ESTIVER COM O RECURSO 'MUTADO' LIGADO E USUARIO NÃO FOR ADMINISTRADOR
    if (isGroup && !isAdmin && dataBd?.mutar) return false;
    //SE FOR MENSAGEM DE GRUPO, O BOT NÃO FOR ADMIN E ESTIVER COM RESTRIÇÃO DE MENSAGENS PARA ADMINS
    if (isGroup && !isBotAdmin && dataBd?.restrito_msg) return false;

    //ATUALIZE NOME DO USUÁRIO
    await userController.updateName(sender, pushName ?? 'Sem nome!');

    // VERIFICANDO EXPIRAÇÃO DO PLANO ATIVO DO USUÁRIO
    await userController.checkUserExpiration(sender);

    if (existCommands.exists || autostickerpv || autostickergp) {
      // Marcar como lida somente quando vamos responder/agir
      await sock.readMessage(message.key);

      if (dataBot?.command_rate?.status) {
        let limiteComando = await botController.checkLimitCommand(
          sender,
          dataUser?.tipo ?? 'comum',
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
      if (dataBot.limite_diario?.status) {
        await botController.checkExpirationLimit(dataBot);
        if ((existCommands.exists && !msgGuia) || autostickerpv || autostickergp) {
          let ultrapassou = await userController.verificarUltrapassouLimiteComandos(
            sender,
            dataBot,
          );
          if (!ultrapassou) {
            await userController.addContagemDiaria(sender);
          } else {
            if (!avisoLimiteDiarioCache.get(sender)) {
              avisoLimiteDiarioCache.set(sender, true);
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
          await userController.addContagemTotal(sender);
        }
      } else {
        await userController.addContagemTotal(sender);
      }
      //ADICIONA A CONTAGEM DE COMANDOS EXECUTADOS PELO BOT
      await botController.updateCommands();
    }

    return true;
  } catch (error) {
    return false;
  }
};
