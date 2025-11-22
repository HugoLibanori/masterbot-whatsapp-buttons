import { downloadMediaMessage } from '@itsukichan/baileys';
import readline from 'readline';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import fs from 'fs-extra';
import { tmpdir } from 'node:os';
import path from 'path';
import crypto from 'node:crypto';
import pkg from 'node-webpmux';
const { Image } = pkg;
import sharp from 'sharp';
import stream from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import vision from '@google-cloud/vision';
import figlet from 'figlet';
import axios from 'axios';
import Jimp from 'jimp';
import moment from 'moment-timezone';
import UserAgent from 'user-agents';
import { JSDOM } from 'jsdom';

import * as types from '../types/BaileysTypes/index.js';
import {
  Bot,
  Command,
  MessageContent,
  FileExtensions,
  Grupo,
  ResultadoBrasileirao,
  RodadaBrasileirao,
  PartidaBrasileirao,
  TimeBrasileirao,
} from '../interfaces/index.js';
import { commandInfo } from '../bot/messages/messagesObj.js';
import { ISocket } from '../types/MyTypes/index.js';
import { typeMessages } from '../bot/messages/contentMessage.js';
import * as userController from '../bot/controllers/UserController.js';
import * as api from '../bot/api/sticker.js';

export const question = (question: string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise<string>((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
};

export const onlyNumbers = (str: string) => str.replace(/\D/g, '');

export async function connectionPairingCode(client: types.MyWASocket) {
  const answerNumber = await question('Digite o seu telefone: ');
  const code = await client.requestPairingCode(answerNumber.replace(/\W+/g, ''));
  console.log('Seu código de emparelhamento:', code);
}

export async function connectionQr(qr: string) {
  if (qr) {
    await new Promise<void>((resolve) => {
      qrcode.generate(qr, { small: true }, (qrcode) => {
        console.log(qrcode);
        resolve();
      });
    });
  }
}

export const ramdomDelay = (minDelayMs: number, maxDelayMs: number): Promise<void> => {
  const delayMs = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
  return new Promise((resolve) => setTimeout(resolve, delayMs));
};

export const textColor = (text: string, color = '') => {
  return !color ? chalk.green(text) : chalk.hex(color)(text);
};

export const createText = (texto: string, ...params: (string | string[])[]) => {
  const flattenedParams = params.flat();

  for (let i = 0; i < flattenedParams.length; i++) {
    texto = texto.replace(`{p${i + 1}}`, flattenedParams[i]);
  }

  return texto;
};

export const checkEnvironmentVariables = () => {
  const variaveisObrigatorias = [
    'DATABASE',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD',
    'DATABASE_HOST',
    'DATABASE_PORT',
  ];

  for (const variavel of variaveisObrigatorias) {
    const valor = process.env[variavel];
    if (!valor || valor === '??????') {
      console.log(
        textColor(
          `Erro: A variável de ambiente ${variavel} não está configurada corretamente (valor: ${valor}). Preencha o arquivo .env antes de iniciar o bot.`,
          '#d63e3e',
        ),
      );
      process.exit(1);
    }
  }
  console.log('Todas as variáveis de ambiente estão configuradas corretamente.');
};

export const commandLog = (
  comando: string,
  sender: string,
  grupo: string | null,
  isGroup: boolean,
) => {
  const hora = new Date().toLocaleTimeString('pt-BR');
  const data = new Date().toLocaleDateString('pt-BR');

  const remetente = sender.replace('@s.whatsapp.net', '');

  const destino = isGroup
    ? `${chalk.bold.blue('👥 GRUPO:')} ${chalk.greenBright(grupo ?? 'Desconhecido')}`
    : `${chalk.bold.red('👤 PRIVADO')}`;

  console.log(
    `${chalk.gray(`[${data} ${hora}]`)} ` +
      `${chalk.bold.green('💬 COMANDO:')} ${chalk.cyan(comando.padEnd(5))} ` +
      `${chalk.bold.yellow('👤 DE:')} ${chalk.magenta(remetente.padEnd(5))} ` +
      `${destino} `,
  );
};

export const runCommand = async (
  cmd: Command | undefined,
  sock: ISocket,
  message: types.MyWAMessage,
  messageContent: MessageContent,
  args: string[],
  dataBot: Partial<Bot>,
) => {
  if (!cmd) return;

  const textMessage = commandInfo();

  await cmd.exec(sock, message, messageContent, args, dataBot, textMessage);
};

export const autoSticker = async (
  sock: ISocket,
  message: types.MyWAMessage,
  mensagemBaileys: MessageContent,
  botInfo: Partial<Bot>,
): Promise<boolean> => {
  //Atribuição de valores
  const comandos_info = commandInfo();
  const { name, pack_sticker } = botInfo;
  const { id_chat, type, media, sender } = mensagemBaileys;
  const { seconds } = { ...media };
  const packSticker = await userController.getPack(sender);
  const autorSticker = await userController.getAuthor(sender);

  try {
    //Verificando se é imagem ou video e fazendo o sticker automaticamente
    if (type === typeMessages.IMAGE || type === typeMessages.VIDEO) {
      if (type === typeMessages.VIDEO && seconds! > 10) return false;
      await sock.sendReact(message.key, '🕒', id_chat);
      let bufferMidia = await downloadMediaMessage(message, 'buffer', {});
      if (!bufferMidia) return false;
      let { resultado: resultadoSticker } = await api.createNameSticker(bufferMidia, {
        pack: packSticker ? packSticker?.trim() : pack_sticker?.trim(),
        autor: autorSticker ? autorSticker?.trim() : name?.trim(),
      });
      if (
        !resultadoSticker ||
        typeof resultadoSticker !== 'object' ||
        resultadoSticker.length === 0
      ) {
        return false;
      }
      await sock.sendSticker(id_chat, resultadoSticker);
      await sock.sendReact(message.key, '✅', id_chat);
      if (sender) {
        setImmediate(async () => {
          try {
            const { XPService } = await import('../services/XPService.js');
            const res: any = await XPService.addEvent(sender, 'sticker_create');
            if (res?.changed && id_chat) {
              const { xpRules } = await import('../configs/xp/xpRules.js');
              const order = xpRules.tiers.map((t) => t.name);
              const idxOld = order.indexOf(res.oldTier);
              const idxNew = order.indexOf(res.newTier);
              const up = idxNew > idxOld;
              const arrow = up ? '⬆️' : '⬇️';
              const msg = up
                ? `Parabéns @${sender.replace('@s.whatsapp.net', '')}! Você subiu para ${String(res.newTier).toUpperCase()}!`
                : `Atenção @${sender.replace('@s.whatsapp.net', '')}, seu tier mudou para ${String(res.newTier).toUpperCase()}.`;
              await sock.sendTextWithMentions(id_chat, `${arrow} ${msg}`, [sender]);
            }
          } catch {}
        });
      }
      return false;
    }
    return true;
  } catch (err: any) {
    if (!err.erro) throw err;
    await sock.replyText(
      id_chat,
      createText(comandos_info.outros.erro_api, 'AUTO-STICKER', err.erro),
      message,
    );
    return true;
  }
};

export const getDefaultMessageContent = (): MessageContent => {
  return {
    id_chat: '',
    command: '',
    textReceived: '',
    numberBot: '',
    sender: '',
    senderLid: '',
    grupo: {
      id_group: '',
      name: '',
      description: '',
      participants: [],
      owner: '',
      isAdmin: false,
      isBotAdmin: false,
      mentionedJid: [],
      dataBd: {
        id_grupo: '',
        nome: '',
        participantes: [],
        admins: [],
        dono: '',
        restrito_msg: false,
        mutar: false,
        bemvindo: {
          status: false,
          msg: '',
        },
        antifake: {
          status: false,
          ddi_liberados: [],
        },
        antilink: {
          status: false,
          filtros: {
            instagram: false,
            youtube: false,
            facebook: false,
            tiktok: false,
          },
        },
        antiporno: { status: false, time: { start: '', end: '' } },
        antiflood: {
          status: false,
          max: 0,
          intervalo: 0,
          msgs: [],
        },
        autosticker: false,
        contador: {
          status: false,
          inicio: '',
        },
        block_cmds: [],
        lista_negra: [],
        descricao: '',
        openai: {
          status: false,
        },
      },
    },
    contentQuotedMsg: {
      sender: '',
    },
  };
};

export const removeWhatsAppFormatting = (command: string | undefined) => {
  if (!command) return '';
  return command.replace(/^([*_~`]+)(.*?)([*_~`]+)$/, '$2');
};

export const getPathTemp = (ext: string) => {
  if (!fs.existsSync(path.join(tmpdir(), 'lbot-api-midias')))
    fs.mkdirSync(path.join(tmpdir(), 'lbot-api-midias'));
  return path.join(tmpdir(), 'lbot-api-midias', `${crypto.randomBytes(20).toString('hex')}.${ext}`);
};

export const getRandomFilename = (ext: FileExtensions): string => {
  return `${Math.floor(Math.random() * 10000)}.${ext}`;
};

export const checkCommandExists = async (
  botInfo: Partial<Bot>,
  command: string,
  id_usuario?: string,
): Promise<boolean | string> => {
  const ownerBot = await userController.getOwner();
  const isOwner = ownerBot === id_usuario;
  const commandsBasePath = path.resolve('src', 'bot', 'commands');
  if (!command || !botInfo.prefix) return false;

  const nameCommand = command.replace(botInfo.prefix, '').trim();
  const categories = ['admins', 'owner', 'users'];

  for (const category of categories) {
    const commandPathTs = path.join(commandsBasePath, category, `${nameCommand}.ts`);
    const commandPathJs = path.join(commandsBasePath, category, `${nameCommand}.js`);

    if (fs.existsSync(commandPathTs) || fs.existsSync(commandPathJs)) {
      if ((category === 'admins' || category === 'owner') && !isOwner) {
        return 'protegido';
      }
      return true;
    }
  }

  return false;
};

export const isPlatform = async (link: string, grupo: Grupo) => {
  let isPlataforma = false;
  if (
    link.match(
      new RegExp(
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/[^/\n\s]+\/|(?:youtu\.be\/))([^\s]+)/gi,
      ),
    ) &&
    grupo.antilink.filtros.youtube
  ) {
    isPlataforma = true;
  } else if (
    link.match(new RegExp(/(?:^|)(https?:\/\/www\.instagram\.com\/\w+\/[^\s]+)(?=\s|$)/gi)) &&
    grupo.antilink.filtros.instagram
  ) {
    isPlataforma = true;
  } else if (
    link.match(
      new RegExp(
        /(?:^|)(https?:\/\/www\.(mbasic.facebook|m\.facebook|facebook|fb)\.(com|me)\/\w+\/[^\s]+)(?=\s|$)/gi,
      ),
    ) &&
    grupo.antilink.filtros.facebook
  ) {
    isPlataforma = true;
  } else if (
    link.match(/(?:^|\s)(https?:\/\/(www|vm)?\.tiktok\.com\/\S+)(?=\s|$)/gi) &&
    grupo.antilink.filtros.tiktok
  ) {
    isPlataforma = true;
  }

  return isPlataforma;
};

export const checkIfWebpIsAnimated = async (buffer: Buffer) => {
  try {
    const img = new Image();
    await img.load(buffer);

    const temAnimacao = img.hasAnim;

    return temAnimacao ? 'animado' : 'estático';
  } catch (err) {
    console.error('Erro ao verificar o arquivo WebP:', err);
    return null;
  }
};

export const videoBufferToImageBuffer = (videoBuffer: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const videoStream = new stream.PassThrough();
    videoStream.end(videoBuffer);

    const ffmpegProcess = ffmpeg(videoStream)
      .on('error', (err) => {
        reject(err);
      })
      .outputOptions(['-vframes 1', '-f image2', '-vcodec png'])
      .format('image2pipe')
      .pipe(new stream.PassThrough(), { end: true });

    let chunks: Uint8Array<ArrayBufferLike>[] = [];
    ffmpegProcess.on('data', (chunk) => {
      chunks.push(chunk);
    });

    ffmpegProcess.on('end', async () => {
      const imageBuffer = Buffer.concat(chunks);

      // Verifique se o buffer de imagem não está vazio
      if (imageBuffer.length === 0) {
        return reject(new Error('O buffer de imagem está vazio!'));
      }

      try {
        // Agora você pode manipular a imagem com o sharp
        const processedImage = await sharp(imageBuffer)
          .resize(512, 512) // Exemplo: redimensiona para 512x512
          .toFormat('png')
          .toBuffer();

        resolve(processedImage); // Retorna o buffer da imagem processada
      } catch (error) {
        reject(error);
      }
    });
  });
};

export const webpBufferToImageSharp = (webpBuffer: Buffer) => {
  return sharp(webpBuffer).resize(512, 512).toFormat('png').toBuffer();
};

export const getNsfw = async (bufferImage: Buffer, botInfo: Partial<Bot>, sock: ISocket) => {
  if (!botInfo.apis?.google.api_key) return false;
  const client = new vision.ImageAnnotatorClient({
    apiKey: botInfo.apis?.google.api_key,
  });
  try {
    const [result] = await client.safeSearchDetection(bufferImage);
    const detections = result.safeSearchAnnotation;
    return detections?.adult === 'VERY_LIKELY';
  } catch (error: any) {
    if (error.response) {
      console.log(error.response.data);
      throw new Error(error.response.data);
    } else {
      console.log(error.message);
      throw new Error(error.message);
    }
  }
};

export const currentTimeWithinRange = (horario1: string, horario2: string): boolean => {
  const [h1, m1] = horario1.split('h').map(Number);
  const [h2, m2] = horario2.split('h').map(Number);

  const now = new Date();
  const horaAtualStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;

  const currenttime = now.getHours() * 60 + now.getMinutes();
  const start = h1 * 60 + m1;
  const end = h2 * 60 + m2;

  let dentroDoHorario: boolean;

  if (start <= end) {
    dentroDoHorario = currenttime >= start && currenttime <= end;
  } else {
    dentroDoHorario = currenttime >= start || currenttime <= end;
  }

  const status = dentroDoHorario ? chalk.green('✅ LIBERADO') : chalk.red('❌ BLOQUEADO');

  console.log(
    chalk.yellow('[ANTI-PORNO]') +
      ` Agora: ${horaAtualStr} — Intervalo: ${horario1} até ${horario2} → ${status}`,
  );

  return dentroDoHorario;
};

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const commandGuide = async (
  sock: ISocket,
  dataBot: Partial<Bot>,
  commandName: string,
  cmd: Command,
) => {
  const textMessage = commandInfo();
  const categorias = Object.values(textMessage) as Record<
    string,
    {
      guia: string;
      descricao: string;
    }
  >[];

  for (const categoria of categorias) {
    if (cmd.aliases[0] in categoria) {
      const comando = categoria[cmd.aliases[0]];
      return textMessage.outros?.cabecalho_guia + comando.guia;
    }
  }

  return '';
};

export const logCommand = (
  comando: string,
  sender: string,
  grupo: string | null,
  isGroup: boolean,
) => {
  const hora = new Date().toLocaleTimeString('pt-BR');
  const data = new Date().toLocaleDateString('pt-BR');

  const remetente = sender.replace('@s.whatsapp.net', '');

  const destino = isGroup
    ? `${chalk.bold.blue('👥 GRUPO:')} ${chalk.greenBright(grupo ?? 'Desconhecido')}`
    : `${chalk.bold.red('👤 PRIVADO')}`;

  console.log(
    `${chalk.gray(`[${data} ${hora}]`)} ` +
      `${chalk.bold.green('💬 COMANDO:')} ${chalk.cyan(comando.padEnd(5))} ` +
      `${chalk.bold.yellow('👤 DE:')} ${chalk.magenta(remetente.padEnd(5))} ` +
      `${destino} `,
  );
};

export const consoleErro = (msg: string, tipo_erro = 'API') => {
  console.error(textColor(`[${tipo_erro}]`, '#d63e3e'), msg);
};

export const nameBotLog = () => {
  figlet('M@ste® Bot', (err, data) => {
    if (err) {
      console.log('Erro ao gerar o banner ASCII');
      return;
    }

    console.log(chalk.cyanBright(data));

    console.log(chalk.gray('🤖 Sistema operacional online... Aguardando comandos.'));
  });
};

export const checkExpirationDate = (inicio: string, exp: string) => {
  if (!inicio || !exp) return false;
  let partesDataHoje = inicio?.split('/');
  let dataHojeObj = new Date(
    Number(partesDataHoje[2]),
    Number(partesDataHoje[1]) - 1,
    Number(partesDataHoje[0]),
  );
  let miliDataHoje = dataHojeObj.getTime();

  let partesExpiracao = exp?.split('/');
  let expObj = new Date(
    Number(partesExpiracao[2]),
    Number(partesExpiracao[1]) - 1,
    Number(partesExpiracao[0]),
  );
  let miliExpiracao = expObj.getTime();

  return miliDataHoje > miliExpiracao;
};

export const commandErrorMsg = (comando: string) => {
  const comandos_info = commandInfo();
  return createText(comandos_info.outros.cmd_erro, comando, comando);
};

export const getClima = async (cidade: string) => {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: cidade,
        lang: 'pt_br',
        units: 'Imperial', // Celsius
        appid: 'c546a1ee1a4bd73967439dba7dd9f1c3',
      },
    });

    const data = response.data;

    return {
      nome: data.name,
      descricao: data.weather[0].description,
      temperatura: `${((data.main.temp - 32) * 5) / 9}`,
      sensacao: `${((data.main.feels_like - 32) * 5) / 9}`,
      umidade: data.main.humidity,
      vento: Math.round(data.wind.speed / 0.62137),
    };
  } catch (err) {
    return null;
  }
};

export const downloadBufferLink = async (url: string): Promise<Buffer> => {
  try {
    const resposta = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36',
      },
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(resposta.data, 'binary');
    return buffer;
  } catch (err: any) {
    console.error('Erro ao baixar mídia:', err);
    return Buffer.from('');
  }
};

export const verifiedLink = async (url: string) => {
  try {
    const response = await axios.head(url);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const addLGBTQOverlay = async (imageBuffer: Buffer) => {
  const rainbowColors = [
    0xe40303ff, // Vermelho
    0xff8c00ff, // Laranja
    0xffed00ff, // Amarelo
    0x008026ff, // Verde
    0x004dffff, // Azul
    0x750787ff, // Roxo
  ];
  const image = await Jimp.read(imageBuffer);
  const { width, height } = image.bitmap;
  const stripeHeight = height / rainbowColors.length;

  for (let i = 0; i < rainbowColors.length; i++) {
    const stripe = new Jimp(width, stripeHeight, rainbowColors[i]);
    image.composite(stripe, 0, i * stripeHeight, {
      mode: Jimp.BLEND_MULTIPLY,
      opacitySource: 0.5,
      opacityDest: 0.9,
    });
  }

  return await image.getBufferAsync(Jimp.MIME_JPEG);
};

export const convertSecondsToMinutes = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const circleMask = (
  inputPath: string,
  outputPath: string,
  maskPath = path.resolve('mascara/circle_mask.png'),
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .input(maskPath)
      .complexFilter([
        "[0:v]crop='if(gt(iw,ih),ih,iw)':'if(gt(ih,iw),iw,ih)',scale=256:256,format=rgba[video];" +
          '[1:v]scale=256:256,format=rgba[mask];' +
          '[video][mask]alphamerge',
      ])
      .outputOptions([
        '-vcodec',
        'libwebp',
        '-loop',
        '0',
        '-ss',
        '00:00:00.0',
        '-t',
        '00:00:10.0',
        '-preset',
        'default',
        '-an',
        '-vsync',
        '0',
        '-quality',
        '50',
        '-b:v',
        '400K',
        '-compression_level',
        '6',
        '-fs',
        '1000000',
      ])
      .save(outputPath)
      .on('end', () => {
        fs.readFile(outputPath, (err, data) => {
          if (err) {
            return reject('Error reading output file');
          }
          resolve(data);
        });
      })
      .on('error', (err) => {
        console.error('Error applying mask:', err);
        reject(err);
      });
  });
};

export const verificarSeWebpEhAnimado = async (buffer: Buffer) => {
  try {
    const img = new Image();
    await img.load(buffer);

    const temAnimacao = img.hasAnim;

    return temAnimacao ? 'animado' : 'estático';
  } catch (err) {
    console.error('Erro ao verificar o arquivo WebP:', err);
    return null;
  }
};

export const timestampForData = (timestampMsg: number | Date) => {
  return moment(timestampMsg).format('DD/MM HH:mm:ss');
};

const getPage = async (url: string): Promise<Document> => {
  const userAgent = new UserAgent();
  const { data } = await axios.get(url, { headers: { 'User-Agent': userAgent.toString() } });
  const { window } = new JSDOM(data);
  return window.document;
};

const getDataTable = async (url: string): Promise<TimeBrasileirao[]> => {
  const document = await getPage(url);
  const times: TimeBrasileirao[] = [];
  const $times = document.querySelectorAll('table > tbody > tr');

  $times.forEach(($time: Element) => {
    const dadosTime: TimeBrasileirao = {
      nome: ($time.querySelector('.team-name > a') as HTMLAnchorElement)?.title || '',
      escudo: ($time.querySelector('.shield > a > img') as HTMLImageElement)?.src || '',
      posicao: $time.querySelector('.position')?.innerHTML || '',
      pontos: $time.querySelector('.points')?.innerHTML || '',
      jogos: $time.querySelector('td[title="Jogos"]')?.innerHTML || '',
      vitorias: $time.querySelector('td[title="Vitórias"]')?.innerHTML || '',
      empates: $time.querySelector('td[title="Empates"]')?.innerHTML || '',
      derrotas: $time.querySelector('td[title="Derrotas"]')?.innerHTML || '',
      gols_pro: $time.querySelector('td[title="Gols Pró"]')?.innerHTML || '',
      gols_contra: $time.querySelector('td[title="Gols Contra"]')?.innerHTML || '',
      saldo_gols: $time.querySelector('td[title="Saldo de Gols"]')?.innerHTML || '',
      aproveitamento: ($time.querySelector('td[title="Aproveitamento"]')?.innerHTML || '') + '%',
    };
    times.push(dadosTime);
  });

  return times;
};

export const getBrasileiraoA = async (rodadas = true): Promise<ResultadoBrasileirao> => {
  const URL_TABELA =
    'https://p1.trrsf.com/api/musa-soccer/ms-standings-light?idChampionship=1436&idPhase=&language=pt-BR&country=BR&nav=N&timezone=BR';
  const URL_RODADAS =
    'https://p1.trrsf.com/api/musa-soccer/ms-standings-games-light?idChampionship=1436&idPhase=&language=pt-BR&country=BR&nav=N&timezone=BR';
  const resultado: ResultadoBrasileirao = { tabela: await getDataTable(URL_TABELA) };
  if (rodadas) {
    resultado.rodadas = await obterDadosRodadas(URL_RODADAS);
  }
  return resultado;
};

const obterDadosRodadas = async (url: string): Promise<RodadaBrasileirao[]> => {
  const document = await getPage(url);
  const rodadas: RodadaBrasileirao[] = [];
  const $rodadas = document.querySelectorAll('ul.rounds > li');

  $rodadas.forEach(($rodada) => {
    const data =
      $rodada.querySelector('br.date-round')?.getAttribute('data-date')?.split(' ')[0] || '';
    const [ano, mes, dia] = data.split('-');

    const dadosRodada: RodadaBrasileirao = {
      rodada: $rodada.querySelector('h3')?.innerHTML || '',
      inicio: `${dia}/${mes}/${ano}`,
      rodada_atual: $rodada.getAttribute('class') === 'round',
      partidas: [],
    };

    const $partidas = $rodada.querySelectorAll('li.match');
    $partidas.forEach(($partida) => {
      const times = $partida.querySelector('meta[itemprop="name"]')?.getAttribute('content') || '';
      const [time_casa, time_fora] = times.split('x').map((time) => time.trim());
      const gols_casa = $partida.querySelector('.goals.home')?.innerHTML || null;
      const gols_fora = $partida.querySelector('.goals.away')?.innerHTML || null;

      const partida: PartidaBrasileirao = {
        partida: times,
        data: $partida.querySelector('div.details > strong.date-manager')?.innerHTML || '',
        local: $partida.querySelector('div.details > span.stadium')?.innerHTML || '',
        time_casa,
        time_fora,
        gols_casa,
        gols_fora,
        resultado_texto: `${time_casa} ${gols_casa} x ${gols_fora} ${time_fora}`,
      };
      dadosRodada.partidas.push(partida);
    });

    rodadas.push(dadosRodada);
  });

  return rodadas;
};

export const converterDataISOParaTimestampEmSegundos = (dataISO: string): number => {
  const data = new Date(dataISO);

  const timestampEmMilissegundos = data.getTime();

  const timestampEmSegundos = Math.floor(timestampEmMilissegundos / 1000);

  return timestampEmSegundos;
};
