import moment from 'moment-timezone';

import { commandInfo } from '../../bot/messages/messagesObj.js';
import BotModel from '../../database/models/Bot.js';
import { Bot } from '../../interfaces/index.js';
import { ISocket } from '../../types/MyTypes/index.js';
import { createText, textColor, checkCommandExists } from '../../utils/utils.js';
import { BotData } from '../../configs/configBot/BotData.js';
import * as userController from '../../bot/controllers/UserController.js';

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

    const currentData = bot.get({ plain: true });
    const newData = { ...currentData, ...data };

    if (newData.started && typeof newData.started === 'number') {
      newData.started = new Date(newData.started);
    }

    await bot.update(newData);
    BotData.set(newData as Partial<Bot>);

    return bot;
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
    // ensure legacy compatibility: if column name is snake_case in DB, Sequelize will return with that
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
    const bot = botInfo;
    bot.started = moment().tz('America/Sao_Paulo').toDate();
    bot.number_bot = await socket.getNumberBot();
    await updateBotData(bot);

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

  const userLimitArray = Array.from(bot.command_rate.user_limit.values());

  //VERIFICA OS USUARIOS LIMITADOS QUE JÁ ESTÃO EXPIRADOS E REMOVE ELES DA LISTA
  for (let i = 0; i < userLimitArray.length; i++) {
    if (userLimitArray[i].horario_liberacao <= timestamp_atual)
      bot.command_rate.user_limit.splice(i, 1);
  }

  //VERIFICA OS USUARIOS QUE JÁ ESTÃO COM COMANDO EXPIRADOS NO ULTIMO MINUTO
  for (let i = 0; i < bot.command_rate.user.length; i++) {
    if (bot.command_rate.user[i].expiracao <= timestamp_atual) bot.command_rate.user.splice(i, 1);
  }

  //SE NÃO FOR UM USUARIO DO TIPO DONO OU FOR ADMINISTRADOR DO GRUPO , NÃO FAÇA A CONTAGEM.
  if (tipo_usuario == 'dono' || isAdmin) {
    resposta.comando_bloqueado = false;
  } else {
    //VERIFICA SE O USUARIO ESTÁ LIMITADO
    let usuarioIndexLimitado = bot.command_rate.user_limit.findIndex(
      (usuario) => usuario.usuario_id == usuario_id,
    );
    if (usuarioIndexLimitado != -1) {
      resposta = {
        comando_bloqueado: true,
        msg: createText(
          comandos_info.admin.taxacomandos.msgs.resposta_usuario_limitado,
          bot.command_rate.block_time.toString(),
        ),
      };
    } else {
      //OBTEM O INDICE DO USUARIO NA LISTA DE USUARIOS
      let usuarioIndex = bot.command_rate.user.findIndex(
        (usuario) => usuario.usuario_id == usuario_id,
      );
      //VERIFICA SE O USUARIO ESTÁ NA LISTA DE USUARIOS
      if (usuarioIndex != -1) {
        bot.command_rate.user[usuarioIndex].cmds++; //ADICIONA A CONTAGEM DE COMANDOS ATUAIS
        if (bot.command_rate.user[usuarioIndex].cmds >= bot.command_rate.max_cmds_minute + 1) {
          //SE ATINGIR A QUANTIDADE MAXIMA DE COMANDOS POR MINUTO
          //ADICIONA A LISTA DE USUARIOS LIMITADOS
          bot.command_rate.user_limit.push({
            usuario_id,
            horario_liberacao: timestamp_atual + bot.command_rate.block_time,
          });
          bot.command_rate.user.splice(usuarioIndex, 1);
          resposta = {
            comando_bloqueado: true,
            msg: createText(
              comandos_info.admin.taxacomandos.msgs.resposta_usuario_limitado,
              bot.command_rate.block_time.toString(),
            ),
          };
        } else {
          //SE NÃO ATINGIU A QUANTIDADE MÁXIMA DE COMANDOS
          resposta.comando_bloqueado = false;
        }
      } else {
        //SE NÃO EXISTIR NA LISTA
        bot.command_rate.user.push({
          usuario_id,
          cmds: 1,
          expiracao: timestamp_atual + 60,
        });
        resposta.comando_bloqueado = false;
      }
    }
  }

  await updateBotData(bot); //ATUALIZA OS DADOS NO ARQUIVO E RETORNO
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
    bot.limite_diario.expiracao = timestamp_atual + 86400;
    await updateBotData(bot);
  }
};

export const updateCommands = async () => {
  let bot = await getBotData();

  if (bot) {
    bot.executed_cmds = (bot.executed_cmds || 0) + 1;

    await updateBotData(bot);
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

  if (!bot.apis) {
    bot.apis = {
      google: { api_key: apikey },
      simi: { api_key: apikey },
      rapidAPI: { api_key: apikey },
      openai: { api_key: apikey },
    };
  }

  bot.apis[nameApi as keyof typeof bot.apis].api_key = apikey;

  await updateBotData(bot);
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
  await BotModel.update({ block_cmds: novos }, { where: { id: 1 } });

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
      // Remove da lista
      const index = updatedCommands.indexOf(comando);
      if (index !== -1) updatedCommands.splice(index, 1);

      respText += createText(
        textCommands.admin.dcmdglobal.msgs.resposta_variavel.desbloqueado_sucesso,
        comando,
      );
    }
  }

  await BotModel.update({ block_cmds: updatedCommands }, { where: { id: 1 } });

  return respText;
};

export const removeUserType = async (botInfo: Partial<Bot>, tipo: string) => {
  const tiposNaoRemoviveis = ['comum', 'dono'];
  let bot = botInfo;
  if (!bot.limite_diario) return false;
  let tiposAtuais = Object.keys(bot.limite_diario.limite_tipos);
  let tipoInserido = tipo.toLowerCase().replaceAll(' ', '');
  if (!tiposAtuais.includes(tipoInserido)) return false;
  if (tiposNaoRemoviveis.includes(tipoInserido)) return false;
  delete bot.limite_diario.limite_tipos[tipoInserido];
  await updateBotData(bot);
  return true;
};

export const changeDailyLimit = async (status: boolean, botInfo: Partial<Bot>) => {
  const bot = botInfo;
  const timestamp_atual = Math.round(new Date().getTime() / 1000);
  if (!bot.limite_diario) return;
  bot.limite_diario.expiracao = status ? timestamp_atual + 86400 : 0;
  bot.limite_diario.status = status;
  await updateBotData(bot);
};

export const changeAdmName = async (nome: string, botInfo: Partial<Bot>) => {
  let bot = botInfo;
  bot.name_admin = nome;
  await updateBotData(bot);
};

export const changeBotName = async (nome: string, botInfo: Partial<Bot>) => {
  let bot = botInfo;
  bot.name = nome;
  await updateBotData(bot);
};

export const changeStickerName = async (nome: string, botInfo: Partial<Bot>) => {
  let bot = botInfo;
  bot.pack_sticker = nome;
  await updateBotData(bot);
};

export const changeXp = async (xp: boolean, botInfo: Partial<Bot>) => {
  let bot = botInfo;
  if (!bot.xp) return;
  bot.xp.status = xp;
  await updateBotData(bot);
};

export const addUserType = async (
  botInfo: Partial<Bot>,
  tipo: string,
  titulo: string,
  comandos: number | null,
) => {
  let bot = botInfo;
  if (!bot.limite_diario) return false;
  let tiposAtuais = Object.keys(bot.limite_diario.limite_tipos);
  let tipoInserido = tipo.toLowerCase().replaceAll(' ', '');
  if (tiposAtuais.includes(tipoInserido)) return false;
  const tipos = bot.limite_diario.limite_tipos;
  comandos = comandos === -1 ? null : comandos;
  tipos[tipoInserido] = {
    titulo,
    comandos: Number(comandos),
  };
  await updateBotData(bot);
  return true;
};

export const changeGrupoOficial = async (id_Group: string) => {
  const dadosAtuais = await BotModel.findOne({ where: { id: 1 } });

  if (dadosAtuais?.get({ plain: true })) {
    const dadosAtualizados = { ...dadosAtuais?.get({ plain: true }), grupo_oficial: id_Group };

    await BotModel.update(dadosAtualizados, { where: { id: 1 } });
  }
};

export const changeLimiter = async (
  botInfo: Partial<Bot>,
  status = true,
  cmds_minuto = 5,
  tempo_bloqueio = 60,
) => {
  let bot = botInfo;
  if (!bot.command_rate) return;
  bot.command_rate.status = status;
  bot.command_rate.max_cmds_minute = cmds_minuto;
  bot.command_rate.block_time = tempo_bloqueio;
  bot.command_rate.user = [];
  bot.command_rate.user_limit = [];
  await updateBotData(bot);
};

export const changeUserTypeCommands = async (
  tipo: string,
  comandos: number | null,
  botInfo: Partial<Bot>,
) => {
  let bot = botInfo;
  if (!bot.limite_diario) return false;
  let tiposAtuais = Object.keys(bot.limite_diario.limite_tipos);
  comandos = comandos == -1 ? null : comandos;
  if (!tiposAtuais.includes(tipo)) return false;
  bot.limite_diario.limite_tipos[tipo].comandos = comandos;
  await updateBotData(bot);
  return true;
};

export const changeTitleUserType = async (botInfo: Partial<Bot>, tipo: string, titulo: string) => {
  let bot = botInfo;
  if (!bot.limite_diario) return false;
  let tiposAtuais = Object.keys(bot.limite_diario.limite_tipos);
  let tipoInserido = tipo.toLowerCase().replaceAll(' ', '');
  if (!tiposAtuais.includes(tipoInserido)) return false;
  bot.limite_diario.limite_tipos[tipoInserido].titulo = titulo;
  await updateBotData(bot);
  return true;
};
