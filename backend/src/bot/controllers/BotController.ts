import moment from 'moment-timezone';

import { commandInfo } from '../messages/messagesObj.js';
import BotModel from '../../database/models/Bot.js';
import { synchronizeTiersFromBot } from '../../services/XPConfigService.js';
import { Bot } from '../../interfaces/index.js';
import { ISocket } from '../../types/MyTypes/index.js';
import { createText, textColor, checkCommandExists } from '../../utils/utils.js';
import { BotData } from '../../configs/configBot/BotData.js';
import * as userController from './UserController.js';

export const registerBotData = async (sock?: ISocket) => {
  try {
    const [bot, created] = await BotModel.findOrCreate({
      where: { id: 1 },
      defaults: {
        started: new Date(),
        number_bot: (await sock?.getNumberBot()) ?? 'SEM NÚMERO DO BOT',
        name: 'M@ste® Bot',
        name_admin: 'Hugo',
        author_sticker: 'M@ste® Bot',
        pack_sticker: 'M@ste® Bot Stickers',
        prefix: '!',
        executed_cmds: 0,
        autosticker: false,
        block_cmds: [],
        limite_diario: {
          status: false,
          expiracao: 0,
          limite_tipos: {
            comum: {
              titulo: '👤 Comum',
              comandos: 50,
            },
            premium: {
              titulo: '🌟 Premium',
              comandos: 100,
            },
            vip: {
              titulo: '🎖️ VIP',
              comandos: null,
            },
            dono: {
              titulo: '💻 Dono',
              comandos: null,
            },
          },
        },
        commands_pv: true,
        command_rate: {
          status: false,
          max_cmds_minute: 10,
          block_time: 5,
          user: [],
          user_limit: [],
        },
        apis: {
          google: {
            api_key: '',
          },
          simi: {
            api_key: '',
          },
          rapidAPI: {
            api_key: '',
          },
          openai: {
            api_key: '',
          },
          removebg: {
            api_key: '',
          },
        },
        xp: { status: false },
        auto_reply_cooldown_seconds: 86400,
      },
    });

    console.log(
      created
        ? '[BOT] - ' + textColor('✓ Bot configurado pela primeira vez!')
        : '[BOT] - ' + textColor('✓ Bot já configurado.'),
    );
    return bot;
  } catch (error) {
    console.error('Erro ao registrar dados do bot:', error);
    throw error;
  }
};

export const updateBotData = async (data: Partial<Bot>) => {
  try {
    const bot = await BotModel.findOne({ where: { id: 1 } });
    if (!bot) {
      await registerBotData();
      throw new Error('Bot not found');
    }

    // --- CORREÇÃO DE SEGURANÇA ---
    // Atualizamos primeiro o banco com o que veio de NOVO
    await bot.update(data);

    // Depois lemos o estado FINAL do banco para atualizar a memória
    // Isso garante que se o banco tinha coisas novas (do frontend), a gente pegue agora
    const updatedBot = await BotModel.findOne({ where: { id: 1 } });
    const finalData = updatedBot?.get({ plain: true }) as Partial<Bot>;

    if (finalData) {
      BotData.set(finalData);
    }

    return updatedBot;
  } catch (error) {
    console.error('Erro ao atualizar dados do bot:', error);
    throw error;
  }
};

export const getBotData = async (): Promise<Partial<Bot> | null> => {
  try {
    const bot = await BotModel.findOne({ where: { id: 1 } });

    if (!bot) return null;

    const plain = bot.get({ plain: true });
    if (
      plain.auto_reply_cooldown_seconds === undefined &&
      (plain as any).autoReplyCooldownSeconds !== undefined
    ) {
      plain.auto_reply_cooldown_seconds = (plain as any).autoReplyCooldownSeconds;
    }
    return plain as Partial<Bot>;
  } catch (error) {
    console.error('Erro ao obter dados do bot:', error);
    throw error;
  }
};

export const startBot = async (socket: ISocket, botInfo: Partial<Bot>) => {
  try {
    const updatePayload: Partial<Bot> = {
      started: moment().tz('America/Sao_Paulo').toDate(),
      number_bot: await socket.getNumberBot(),
    };
    await updateBotData(updatePayload);

    console.log('[BOT]', textColor(commandInfo().outros.dados_bot));
  } catch (err: any) {
    err.message = `botStart - ${err.message}`;
    throw err;
  }
};

export const checkLimitCommand = async (
  usuario_id: string,
  tipo_usuario: string,
  isAdmin: boolean,
  botInfo: Partial<Bot>,
): Promise<{ comando_bloqueado: boolean; msg: string }> => {
  let bot = botInfo;
  let resposta: { comando_bloqueado: boolean; msg: string } = {
    comando_bloqueado: false,
    msg: '',
  };
  const timestamp_atual = Math.round(new Date().getTime() / 1000);
  const comandos_info = commandInfo();

  if (!bot.command_rate) {
    resposta.comando_bloqueado = false;
    return resposta;
  }

  // Clona para não alterar a referência direta antes da hora
  const commandRate = JSON.parse(JSON.stringify(bot.command_rate));
  const userLimitArray = commandRate.user_limit;

  //VERIFICA OS USUARIOS LIMITADOS QUE JÁ ESTÃO EXPIRADOS E REMOVE ELES DA LISTA
  for (let i = 0; i < userLimitArray.length; i++) {
    if (userLimitArray[i].horario_liberacao <= timestamp_atual) userLimitArray.splice(i, 1);
  }

  //VERIFICA OS USUARIOS QUE JÁ ESTÃO COM COMANDO EXPIRADOS NO ULTIMO MINUTO
  for (let i = 0; i < commandRate.user.length; i++) {
    if (commandRate.user[i].expiracao <= timestamp_atual) commandRate.user.splice(i, 1);
  }

  //SE NÃO FOR UM USUARIO DO TIPO DONO OU FOR ADMINISTRADOR DO GRUPO , NÃO FAÇA A CONTAGEM.
  if (tipo_usuario == 'dono' || isAdmin) {
    resposta.comando_bloqueado = false;
  } else {
    //VERIFICA SE O USUARIO ESTÁ LIMITADO
    let usuarioIndexLimitado = userLimitArray.findIndex(
      (usuario: any) => usuario.usuario_id == usuario_id,
    );
    if (usuarioIndexLimitado != -1) {
      resposta = {
        comando_bloqueado: true,
        msg: createText(
          comandos_info.admin.taxacomandos.msgs.resposta_usuario_limitado,
          commandRate.block_time.toString(),
        ),
      };
    } else {
      //OBTEM O INDICE DO USUARIO NA LISTA DE USUARIOS
      let usuarioIndex = commandRate.user.findIndex(
        (usuario: any) => usuario.usuario_id == usuario_id,
      );
      //VERIFICA SE O USUARIO ESTÁ NA LISTA DE USUARIOS
      if (usuarioIndex != -1) {
        commandRate.user[usuarioIndex].cmds++; //ADICIONA A CONTAGEM DE COMANDOS ATUAIS
        if (commandRate.user[usuarioIndex].cmds >= commandRate.max_cmds_minute + 1) {
          //SE ATINGIR A QUANTIDADE MAXIMA DE COMANDOS POR MINUTO
          //ADICIONA A LISTA DE USUARIOS LIMITADOS
          userLimitArray.push({
            usuario_id,
            horario_liberacao: timestamp_atual + commandRate.block_time,
          });
          commandRate.user.splice(usuarioIndex, 1);
          resposta = {
            comando_bloqueado: true,
            msg: createText(
              comandos_info.admin.taxacomandos.msgs.resposta_usuario_limitado,
              commandRate.block_time.toString(),
            ),
          };
        } else {
          //SE NÃO ATINGIU A QUANTIDADE MÁXIMA DE COMANDOS
          resposta.comando_bloqueado = false;
        }
      } else {
        //SE NÃO EXISTIR NA LISTA
        commandRate.user.push({
          usuario_id,
          cmds: 1,
          expiracao: timestamp_atual + 60,
        });
        resposta.comando_bloqueado = false;
      }
    }
  }

  commandRate.user_limit = userLimitArray;

  // --- AQUI ESTAVA O ERRO ---
  // Antes: await updateBotData(bot); -> Enviava o BOT INTEIRO (com config velha)
  // Agora: Enviamos SÓ o command_rate atualizado
  await updateBotData({ command_rate: commandRate });

  return resposta;
};

export const checkBlockedCommandsGlobal = async (
  comando: string,
  botInfo: Partial<Bot>,
): Promise<boolean | undefined> => {
  return botInfo.block_cmds?.includes(comando);
};

export const checkExpirationLimit = async (botInfo: Partial<Bot>) => {
  let bot = botInfo;
  if (!bot.limite_diario) return;
  let timestamp_atual = Math.round(new Date().getTime() / 1000);

  if (timestamp_atual >= bot.limite_diario.expiracao) {
    await userController.resetCommandsDay();

    // Atualiza APENAS a expiração no banco, mantendo os TIPOS intactos
    const novoLimiteDiario = { ...bot.limite_diario, expiracao: timestamp_atual + 86400 };
    await updateBotData({ limite_diario: novoLimiteDiario });
  }
};

export const updateCommands = async () => {
  // Pega direto do banco para ter a contagem real
  let bot = await getBotData();

  if (bot) {
    const executed_cmds = (bot.executed_cmds || 0) + 1;
    // Atualiza SÓ o contador
    await updateBotData({ executed_cmds });
  } else {
    console.error('Bot não encontrado no banco de dados.');
  }
};

export const getNameApis = async (dataBot: Partial<Bot>) => {
  try {
    const bot = await getBotData();
    const apis = bot?.apis;
    return apis;
  } catch (error) {
    console.error('Erro ao obter dados do bot:', error);
    throw error;
  }
};

export const addApikey = async (nameApi: string, apikey: string, botInfo: Partial<Bot>) => {
  const bot = botInfo;
  if (!bot.apis) return; // Segurança

  const newApis = { ...bot.apis };
  (newApis as any)[nameApi].api_key = apikey;

  // Atualiza APENAS as APIs
  await updateBotData({ apis: newApis });
};

export const blockCommandsGlobal = async (
  comandos: string[],
  dataBot: Partial<Bot>,
  id_usuario: string,
): Promise<string> => {
  const botInfo = dataBot;
  if (!botInfo || !dataBot.prefix) return '';

  const existingCommands = botInfo.block_cmds || [];
  const newCommands: string[] = [];
  const textCommands = commandInfo();
  let respText = textCommands.grupo.bcmd.msgs.resposta_titulo;

  for (const comando of comandos) {
    if (!comando.startsWith(dataBot.prefix)) {
      respText += createText(
        textCommands.admin.bcmdglobal.msgs.resposta_variavel.enviado_erro,
        comando,
      );
      continue;
    }
    const exists = await checkCommandExists(dataBot, comando);

    if (!exists.exists) {
      respText += createText(
        textCommands.admin.bcmdglobal.msgs.resposta_variavel.nao_existe,
        comando,
      );
    } else {
      if (existingCommands.includes(comando)) {
        respText += createText(
          textCommands.admin.bcmdglobal.msgs.resposta_variavel.ja_bloqueado,
          comando,
        );
      } else if (comando.includes('menu') || exists.admin || exists.owner) {
        respText += createText(textCommands.admin.bcmdglobal.msgs.resposta_variavel.erro, comando);
      } else {
        respText += createText(
          textCommands.admin.bcmdglobal.msgs.resposta_variavel.bloqueado_sucesso,
          comando,
        );
        newCommands.push(comando);
      }
    }
  }

  const novos = [...new Set([...existingCommands, ...newCommands])];

  // Update direto via Model para garantir array puro
  await BotModel.update({ block_cmds: novos }, { where: { id: 1 } });
  // Atualiza cache
  await getBotData();

  return respText;
};

export const unblockCommandsGlobal = async (
  comandos: string[],
  dataBot: Partial<Bot>,
): Promise<string> => {
  const botInfo = dataBot;
  if (!botInfo || !dataBot.prefix) return '';

  const existingCommands = botInfo.block_cmds || [];
  const updatedCommands = [...existingCommands];
  const textCommands = commandInfo();
  let respText = textCommands.admin.dcmdglobal.msgs.resposta_titulo;

  for (const comando of comandos) {
    if (!comando.startsWith(dataBot.prefix)) {
      respText += createText(
        textCommands.admin.dcmdglobal.msgs.resposta_variavel.enviado_erro,
        comando,
      );
      continue;
    }

    if (!existingCommands.includes(comando)) {
      respText += createText(
        textCommands.admin.dcmdglobal.msgs.resposta_variavel.ja_desbloqueado,
        comando,
      );
    } else {
      const index = updatedCommands.indexOf(comando);
      if (index !== -1) updatedCommands.splice(index, 1);

      respText += createText(
        textCommands.admin.dcmdglobal.msgs.resposta_variavel.desbloqueado_sucesso,
        comando,
      );
    }
  }

  await BotModel.update({ block_cmds: updatedCommands }, { where: { id: 1 } });
  await getBotData(); // Refresh cache

  return respText;
};

export const removeUserType = async (botInfo: Partial<Bot>, tipo: string) => {
  const tiposNaoRemoviveis = ['comum', 'dono'];
  let bot = await getBotData(); // Pega fresco do banco
  if (!bot || !bot.limite_diario) return false;

  const tiposAtuais = Object.keys(bot.limite_diario.limite_tipos);
  const tipoInserido = tipo.toLowerCase().replaceAll(' ', '');
  if (!tiposAtuais.includes(tipoInserido)) return false;
  if (tiposNaoRemoviveis.includes(tipoInserido)) return false;

  delete bot.limite_diario.limite_tipos[tipoInserido];

  // Atualiza só o limite_diario
  await updateBotData({ limite_diario: bot.limite_diario });

  if (bot?.limite_diario?.limite_tipos) {
    await synchronizeTiersFromBot(bot.limite_diario.limite_tipos);
  }
  return true;
};

export const changeDailyLimit = async (status: boolean, botInfo: Partial<Bot>) => {
  let bot = await getBotData();
  if (!bot || !bot.limite_diario) return;
  const timestamp_atual = Math.round(new Date().getTime() / 1000);

  bot.limite_diario.expiracao = status ? timestamp_atual + 86400 : 0;
  bot.limite_diario.status = status;

  await updateBotData({ limite_diario: bot.limite_diario });
};

export const changeAdmName = async (nome: string, botInfo: Partial<Bot>) => {
  await updateBotData({ name_admin: nome });
};

export const changeBotName = async (nome: string, botInfo: Partial<Bot>) => {
  await updateBotData({ name: nome });
};

export const changeStickerName = async (nome: string, botInfo: Partial<Bot>) => {
  await updateBotData({ pack_sticker: nome });
};

export const changeXp = async (xp: boolean, botInfo: Partial<Bot>) => {
  await updateBotData({ xp: { status: xp } });
};

export const addUserType = async (
  botInfo: Partial<Bot>,
  tipo: string,
  titulo: string,
  comandos: number | null,
) => {
  let bot = await getBotData(); // Pega fresco
  if (!bot || !bot.limite_diario) return false;

  const tiposAtuais = Object.keys(bot.limite_diario.limite_tipos);
  const tipoInserido = tipo.toLowerCase().replaceAll(' ', '');
  if (tiposAtuais.includes(tipoInserido)) return false;

  bot.limite_diario.limite_tipos[tipoInserido] = {
    titulo,
    comandos: Number(comandos) === -1 ? null : Number(comandos),
  };

  await updateBotData({ limite_diario: bot.limite_diario });

  if (bot.limite_diario?.limite_tipos) {
    await synchronizeTiersFromBot(bot.limite_diario.limite_tipos);
  }
  return true;
};

export const changeGrupoOficial = async (id_Group: string) => {
  await updateBotData({ grupo_oficial: id_Group });
};

export const changeLimiter = async (
  botInfo: Partial<Bot>,
  status = true,
  cmds_minuto = 5,
  tempo_bloqueio = 60,
) => {
  const newRate = {
    status,
    max_cmds_minute: cmds_minuto,
    block_time: tempo_bloqueio,
    user: [],
    user_limit: [],
  };
  await updateBotData({ command_rate: newRate });
};

export const changeUserTypeCommands = async (
  tipo: string,
  comandos: number | null,
  botInfo: Partial<Bot>,
) => {
  let bot = await getBotData();
  if (!bot || !bot.limite_diario) return false;

  let tiposAtuais = Object.keys(bot.limite_diario.limite_tipos);
  comandos = comandos == -1 ? null : comandos;
  if (!tiposAtuais.includes(tipo)) return false;

  bot.limite_diario.limite_tipos[tipo].comandos = comandos;

  await updateBotData({ limite_diario: bot.limite_diario });
  return true;
};

export const changeTitleUserType = async (botInfo: Partial<Bot>, tipo: string, titulo: string) => {
  let bot = await getBotData();
  if (!bot || !bot.limite_diario) return false;

  const tiposAtuais = Object.keys(bot.limite_diario.limite_tipos);
  const tipoInserido = tipo.toLowerCase().replaceAll(' ', '');
  if (!tiposAtuais.includes(tipoInserido)) return false;

  bot.limite_diario.limite_tipos[tipoInserido].titulo = titulo;

  await updateBotData({ limite_diario: bot.limite_diario });

  if (bot.limite_diario?.limite_tipos) {
    await synchronizeTiersFromBot(bot.limite_diario.limite_tipos);
  }
  return true;
};

export const getTypes = async (
  botInfo: Partial<Bot>,
): Promise<{
  [key: string]: {
    titulo: string;
    comandos: number | null;
  };
}> => {
  // Sempre busca fresco para exibir no !tipos
  const freshData = await getBotData();
  const tipos = freshData?.limite_diario?.limite_tipos;
  return tipos || {};
};
