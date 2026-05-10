import ytdl, { VideoDetails } from '@distube/ytdl-core';
import yts from 'yt-search';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import fs from 'fs-extra';
import axios from 'axios';
import yt from '@vreden/youtube_scraper';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import { convertSecondsToMinutes, getPathTemp } from '../../utils/utils.js';
import { Bot } from 'interfaces/Bot.js';

const cookies = [
  {
    domain: '.youtube.com',
    expirationDate: 1768363722.123832,
    hostOnly: false,
    httpOnly: false,
    name: '__Secure-1PAPISID',
    path: '/',
    sameSite: 'unspecified',
    secure: true,
    session: false,
    storeId: '1',
    value: '9czruAxHyW9qNfls/ArXCDwLpBGqjaOOmS',
    id: 1,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1768363722.123971,
    hostOnly: false,
    httpOnly: true,
    name: '__Secure-1PSID',
    path: '/',
    sameSite: 'unspecified',
    secure: true,
    session: false,
    storeId: '1',
    value:
      'g.a000rAhFfYfOfAOkeqgYJEBPqOf9gdLBJoh--eJQRkYOH84dJTtedE73oM-0CGC1lF9rv0SAuwACgYKAY4SARASFQHGX2MiB51sE930sxuvX5bhFjh8-RoVAUF8yKqoBkbQ7z_cHt9M_b9m31ih0076',
    id: 2,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1765339742.217763,
    hostOnly: false,
    httpOnly: true,
    name: '__Secure-1PSIDCC',
    path: '/',
    sameSite: 'unspecified',
    secure: true,
    session: false,
    storeId: '1',
    value: 'AKEyXzUKFoVR6XfdEO_aKsOzsDP1s_fv_33qSIEmUjrVvcdwvhYeK_aI1up7kAajIEbPJYuyrA',
    id: 3,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1765339722.123463,
    hostOnly: false,
    httpOnly: true,
    name: '__Secure-1PSIDTS',
    path: '/',
    sameSite: 'unspecified',
    secure: true,
    session: false,
    storeId: '1',
    value: 'sidts-CjIBQT4rX2CpNJsEW1LD-WxfxtKsb-172Bk9IhBZXYzODrVzqozUKBRwqFd7UIs9toUxZhAA',
    id: 4,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1768363722.123878,
    hostOnly: false,
    httpOnly: false,
    name: '__Secure-3PAPISID',
    path: '/',
    sameSite: 'no_restriction',
    secure: true,
    session: false,
    storeId: '1',
    value: '9czruAxHyW9qNfls/ArXCDwLpBGqjaOOmS',
    id: 5,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1768363722.12402,
    hostOnly: false,
    httpOnly: true,
    name: '__Secure-3PSID',
    path: '/',
    sameSite: 'no_restriction',
    secure: true,
    session: false,
    storeId: '1',
    value:
      'g.a000rAhFfYfOfAOkeqgYJEBPqOf9gdLBJoh--eJQRkYOH84dJTte-zEBd2Aw_0xJCfNJVCjA_gACgYKATcSARASFQHGX2MiUyBWjhqKq34hsFjrkVXVyRoVAUF8yKovRcLVrmU6Hnspae0RKryH0076',
    id: 6,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1765339742.217816,
    hostOnly: false,
    httpOnly: true,
    name: '__Secure-3PSIDCC',
    path: '/',
    sameSite: 'no_restriction',
    secure: true,
    session: false,
    storeId: '1',
    value: 'AKEyXzW8Bavs3s5vd8mJcaBLCF546JvyYajP7soUkW2Jt8mbdx1agZAdpjmUzqEGJxyP4ZLU',
    id: 7,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1765339722.123592,
    hostOnly: false,
    httpOnly: true,
    name: '__Secure-3PSIDTS',
    path: '/',
    sameSite: 'no_restriction',
    secure: true,
    session: false,
    storeId: '1',
    value: 'sidts-CjIBQT4rX2CpNJsEW1LD-WxfxtKsb-172Bk9IhBZXYzODrVzqozUKBRwqFd7UIs9toUxZhAA',
    id: 8,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1768363722.123736,
    hostOnly: false,
    httpOnly: false,
    name: 'APISID',
    path: '/',
    sameSite: 'unspecified',
    secure: false,
    session: false,
    storeId: '1',
    value: 'dp35OiJG9qRO89Uj/A2Ho0cyGbA-giOBSa',
    id: 9,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1733805420.176082,
    hostOnly: false,
    httpOnly: true,
    name: 'GPS',
    path: '/',
    sameSite: 'unspecified',
    secure: true,
    session: false,
    storeId: '1',
    value: '1',
    id: 10,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1768363722.123647,
    hostOnly: false,
    httpOnly: true,
    name: 'HSID',
    path: '/',
    sameSite: 'unspecified',
    secure: false,
    session: false,
    storeId: '1',
    value: 'AGmGd8GeNtb7jzwEx',
    id: 11,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1768363722.77757,
    hostOnly: false,
    httpOnly: true,
    name: 'LOGIN_INFO',
    path: '/',
    sameSite: 'no_restriction',
    secure: true,
    session: false,
    storeId: '1',
    value:
      'AFmmF2swRQIgcVbY7BhrB5j7diY8SF9hxX2wcZtuhtPnTPM7szYmFdkCIQCq8HbXVV0yPONrrv3k2lxOcaxS9vDVBv8MackR7tbk9A:QUQ3MjNmd21JZUhTZlBrV2pJT2UwcjNqQnFPdmtzM1I1bXZ0dUF4WEViOGNZS2tlUzdoTjdKVGgwUGxnd1o0NHh6V2N3MFVKZ0ZqVlAwQVVHcWpPNl9rampyWktodFR5WFB1VVppdjZLd01LZkZfby0wNTNuMU12Q1NMMGg2U3pCZjBMaS1CWnJwMFpGOXl2MFlIckZwMjNjYTFsR2ZIamJ3',
    id: 12,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1768363725.384209,
    hostOnly: false,
    httpOnly: false,
    name: 'PREF',
    path: '/',
    sameSite: 'unspecified',
    secure: true,
    session: false,
    storeId: '1',
    value: 'f6=40000000&tz=America.Sao_Paulo',
    id: 13,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1768363722.123785,
    hostOnly: false,
    httpOnly: false,
    name: 'SAPISID',
    path: '/',
    sameSite: 'unspecified',
    secure: true,
    session: false,
    storeId: '1',
    value: '9czruAxHyW9qNfls/ArXCDwLpBGqjaOOmS',
    id: 14,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1768363722.123924,
    hostOnly: false,
    httpOnly: false,
    name: 'SID',
    path: '/',
    sameSite: 'unspecified',
    secure: false,
    session: false,
    storeId: '1',
    value:
      'g.a000rAhFfYfOfAOkeqgYJEBPqOf9gdLBJoh--eJQRkYOH84dJTtehKFBXx-MnBDNxvBIcClG5QACgYKAZMSARASFQHGX2MiQI700wKpYNiwNtWoTPmmdxoVAUF8yKpkQbbHKgww84FRaBvknXIl0076',
    id: 15,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1765339742.217627,
    hostOnly: false,
    httpOnly: false,
    name: 'SIDCC',
    path: '/',
    sameSite: 'unspecified',
    secure: false,
    session: false,
    storeId: '1',
    value: 'AKEyXzVSh5WRRtFNWd2tkhYLOhim9Ez8k15NmjA1XBT_F6KuMOvVQqTf0mQkSo1Ij8mCwjb_VA',
    id: 16,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1768363722.123695,
    hostOnly: false,
    httpOnly: true,
    name: 'SSID',
    path: '/',
    sameSite: 'unspecified',
    secure: true,
    session: false,
    storeId: '1',
    value: 'ApQY7imFHtxGEOIt8',
    id: 17,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1733803746,
    hostOnly: false,
    httpOnly: false,
    name: 'ST-1b',
    path: '/',
    sameSite: 'unspecified',
    secure: false,
    session: false,
    storeId: '1',
    value:
      'disableCache=true&itct=CBUQsV4iEwid45iZqpyKAxWnSEgAHbhCMGc%3D&csn=eiTPqlvOTqwG9gGy&session_logininfo=AFmmF2swRQIgcVbY7BhrB5j7diY8SF9hxX2wcZtuhtPnTPM7szYmFdkCIQCq8HbXVV0yPONrrv3k2lxOcaxS9vDVBv8MackR7tbk9A%3AQUQ3MjNmd21JZUhTZlBrV2pJT2UwcjNqQnFPdmtzM1I1bXZ0dUF4WEViOGNZS2tlUzdoTjdKVGgwUGxnd1o0NHh6V2N3MFVKZ0ZqVlAwQVVHcWpPNl9rampyWktodFR5WFB1VVppdjZLd01LZkZfby0wNTNuMU12Q1NMMGg2U3pCZjBMaS1CWnJwMFpGOXl2MFlIckZwMjNjYTFsR2ZIamJ3&endpoint=%7B%22clickTrackingParams%22%3A%22CBUQsV4iEwid45iZqpyKAxWnSEgAHbhCMGc%3D%22%2C%22commandMetadata%22%3A%7B%22webCommandMetadata%22%3A%7B%22url%22%3A%22%2F%22%2C%22webPageType%22%3A%22WEB_PAGE_TYPE_BROWSE%22%2C%22rootVe%22%3A3854%2C%22apiUrl%22%3A%22%2Fyoutubei%2Fv1%2Fbrowse%22%7D%7D%2C%22browseEndpoint%22%3A%7B%22browseId%22%3A%22FEwhat_to_watch%22%7D%7D',
    id: 18,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1733803747,
    hostOnly: false,
    httpOnly: false,
    name: 'ST-hcbf8d',
    path: '/',
    sameSite: 'unspecified',
    secure: false,
    session: false,
    storeId: '1',
    value:
      'session_logininfo=AFmmF2swRQIgcVbY7BhrB5j7diY8SF9hxX2wcZtuhtPnTPM7szYmFdkCIQCq8HbXVV0yPONrrv3k2lxOcaxS9vDVBv8MackR7tbk9A%3AQUQ3MjNmd21JZUhTZlBrV2pJT2UwcjNqQnFPdmtzM1I1bXZ0dUF4WEViOGNZS2tlUzdoTjdKVGgwUGxnd1o0NHh6V2N3MFVKZ0ZqVlAwQVVHcWpPNl9rampyWktodFR5WFB1VVppdjZLd01LZkZfby0wNTNuMU12Q1NMMGg2U3pCZjBMaS1CWnJwMFpGOXl2MFlIckZwMjNjYTFsR2ZIamJ3',
    id: 19,
  },
  {
    domain: '.youtube.com',
    expirationDate: 1733803746,
    hostOnly: false,
    httpOnly: false,
    name: 'ST-yve142',
    path: '/',
    sameSite: 'unspecified',
    secure: false,
    session: false,
    storeId: '1',
    value:
      'session_logininfo=AFmmF2swRQIgcVbY7BhrB5j7diY8SF9hxX2wcZtuhtPnTPM7szYmFdkCIQCq8HbXVV0yPONrrv3k2lxOcaxS9vDVBv8MackR7tbk9A%3AQUQ3MjNmd21JZUhTZlBrV2pJT2UwcjNqQnFPdmtzM1I1bXZ0dUF4WEViOGNZS2tlUzdoTjdKVGgwUGxnd1o0NHh6V2N3MFVKZ0ZqVlAwQVVHcWpPNl9rampyWktodFR5WFB1VVppdjZLd01LZkZfby0wNTNuMU12Q1NMMGg2U3pCZjBMaS1CWnJwMFpGOXl2MFlIckZwMjNjYTFsR2ZIamJ3',
    id: 20,
  },
];

const proxyAgent = ytdl.createAgent(cookies);

const getCookiesPath = () => {
  const cookiesPath = getPathTemp('txt');
  let cookieContent = '# Netscape HTTP Cookie File\n';
  cookies.forEach((c: any) => {
    const domain = c.domain.startsWith('.') ? c.domain : `.${c.domain}`;
    cookieContent += `${domain}\tTRUE\t${c.path}\t${c.secure ? 'TRUE' : 'FALSE'}\t${Math.floor(c.expirationDate || 0)}\t${c.name}\t${c.value}\n`;
  });
  fs.writeFileSync(cookiesPath, cookieContent);
  return cookiesPath;
};

const YTDLP_PATH = './bin/yt-dlp';

interface RespostaInfoVideo {
  resultado?: VideoDetails & { durationFormatted: string };
  erro?: string;
}

export const getInfoVideoYT = async (texto: string): Promise<RespostaInfoVideo> => {
  const cookiesPath = getCookiesPath();
  const commonArgs = `PATH=$PATH:/home/hugo/.nvm/versions/node/v20.19.4/bin ${YTDLP_PATH} --no-update --cookies ${cookiesPath} --no-check-certificates --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --extractor-args "youtube:player_client=web,android_vr"`;
  try {
    let videoUrl = texto;
    if (!texto.startsWith('http')) {
      const searchResult = await yts(texto);
      videoUrl = searchResult.videos[0]?.url;
    }

    if (!videoUrl) {
      if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);
      return { erro: 'Vídeo não encontrado.' };
    }

    const { stdout: infoJson } = await execAsync(`${commonArgs} -j "${videoUrl}"`);
    const info = JSON.parse(infoJson);
    if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);

    return {
      resultado: {
        videoId: info.id,
        title: info.title,
        lengthSeconds: String(info.duration),
        durationFormatted: convertSecondsToMinutes(info.duration),
        thumbnails: [{ url: info.thumbnail, width: 1920, height: 1080 }],
        isLiveContent: info.is_live,
      } as any,
    };
  } catch (error) {
    if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);
    console.error('Erro no getInfoVideoYT (yt-dlp):', error);
    return { erro: 'Erro ao obter informações do vídeo.' };
  }
};

export const obterYTMP3 = async (
  id_video: string,
  dataBot: Partial<Bot>,
): Promise<{ resultado?: Buffer; erro?: boolean }> => {
  try {
    const options = {
      method: 'GET',
      url: 'https://youtube-mp4-mp3-downloader.p.rapidapi.com/api/v1/download',
      params: {
        format: 'mp3',
        id: id_video,
        audioQuality: '320',
        addInfo: 'false',
      },
      headers: {
        'x-rapidapi-key': dataBot.apis?.rapidAPI.api_key,
        'x-rapidapi-host': 'youtube-mp4-mp3-downloader.p.rapidapi.com',
      },
    };

    const response = await axios.request(options);

    const optionsProgress = {
      method: 'GET',
      url: 'https://youtube-mp4-mp3-downloader.p.rapidapi.com/api/v1/progress',
      params: {
        id: response.data.progressId,
      },
      headers: {
        'x-rapidapi-key': dataBot.apis?.rapidAPI.api_key,
        'x-rapidapi-host': 'youtube-mp4-mp3-downloader.p.rapidapi.com',
      },
    };

    let finished = false;
    let responseProgress;

    while (!finished) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      responseProgress = await axios.request(optionsProgress);
      if (responseProgress?.data?.finished) finished = true;
    }
    const downloadResponse = await axios.get(responseProgress?.data?.downloadUrl, {
      responseType: 'arraybuffer',
    });
    const bufferDownload = Buffer.from(downloadResponse.data);
    return { resultado: bufferDownload };
  } catch (err) {
    console.error('Erro ao baixar MP3 do YouTube:', err);
    return { erro: true };
  }
};


export const converterMp4ParaMp3 = async (inputBuffer: Buffer): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const mp4Stream = new PassThrough();
    const mp3Stream = new PassThrough();

    mp4Stream.end(inputBuffer);
    let chunks: Uint8Array<ArrayBufferLike>[] = [];

    ffmpeg(mp4Stream)
      .format('mp3')
      .on('error', (err) => {
        reject(new Error(`Erro na conversão: ${err.message}`));
      })
      .on('end', () => {
        const outputBuffer = Buffer.concat(chunks);
        resolve(outputBuffer);
      })
      .pipe(mp3Stream);

    mp3Stream.on('data', (chunk) => {
      chunks.push(chunk);
    });
  });
};

export const obterThumbnailVideo = async (
  midia: Buffer | string,
  tipo = 'file',
): Promise<{ resultado?: string; erro?: string }> => {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        let resposta: { resultado?: string; erro?: string } = {};
        let caminhoEntrada: string | undefined;
        const saidaThumbImagem = getPathTemp('jpg');

        if (tipo === 'file') {
          caminhoEntrada = getPathTemp('mp4');
          fs.writeFileSync(caminhoEntrada, midia);
        } else if (tipo === 'buffer') {
          caminhoEntrada = getPathTemp('mp4');
          fs.writeFileSync(caminhoEntrada, midia);
        } else if (tipo === 'url' && typeof midia === 'string') {
          const urlResponse = await axios.get(midia, { responseType: 'arraybuffer' });
          const bufferUrl = Buffer.from(urlResponse.data);
          caminhoEntrada = getPathTemp('mp4');
          fs.writeFileSync(caminhoEntrada, bufferUrl);
        } else if (tipo === 'url') {
          throw new Error('Invalid URL');
        }

        if (!caminhoEntrada) {
          throw new Error('Caminho de entrada não definido.');
        }

        ffmpeg(caminhoEntrada)
          .addOption('-y')
          .inputOptions(['-ss 00:00:00'])
          .outputOptions(['-vf scale=32:-1', '-vframes 1', '-f image2'])
          .save(saidaThumbImagem)
          .on('end', () => {
            if (fs.existsSync(caminhoEntrada)) fs.unlinkSync(caminhoEntrada!);
            const thumbBase64 = fs.readFileSync(saidaThumbImagem).toString('base64');
            if (fs.existsSync(saidaThumbImagem)) fs.unlinkSync(saidaThumbImagem);
            resposta.resultado = thumbBase64;
            resolve(resposta);
          })
          .on('error', (err) => {
            if (fs.existsSync(caminhoEntrada)) fs.unlinkSync(caminhoEntrada);
            if (fs.existsSync(saidaThumbImagem)) fs.unlinkSync(saidaThumbImagem);
            resposta.erro = 'Houve um erro ao obter a thumbnail do video.';
            reject(resposta);
          });
      } catch (err: any) {
        console.log(`API obterThumbnailVideo - ${err.message}`);
        reject({ erro: 'Houve um erro ao obter a thumbnail do video.' });
      }
    })();
  });
};

export const getDataVideo = async (
  url: string,
): Promise<{
  resultado?: {
    buffer: Buffer;
    title?: string;
    durationFormatted?: string;
    thumbnail?: string;
    isLiveContent?: boolean;
  };
  erro?: boolean;
}> => {
  const cookiesPath = getCookiesPath();
  const commonArgs = `PATH=$PATH:/home/hugo/.nvm/versions/node/v20.19.4/bin ${YTDLP_PATH} --no-update --cookies ${cookiesPath} --no-check-certificates --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --extractor-args "youtube:player_client=web,android_vr"`;
  try {
    // Pegar informações do vídeo
    const { stdout: infoJson } = await execAsync(`${commonArgs} -j "${url}"`);
    const info = JSON.parse(infoJson);

    // Baixar o áudio
    return new Promise((resolve) => {
      exec(
        `${commonArgs} -f "ba/b" -o - "${url}"`,
        { encoding: 'buffer', maxBuffer: 100 * 1024 * 1024 },
        (error, stdout) => {
          if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);
          if (error) {
            console.error('Erro no yt-dlp (audio):', error);
            return resolve({ erro: true });
          }
          resolve({
            resultado: {
              buffer: stdout,
              title: info.title,
              durationFormatted: convertSecondsToMinutes(info.duration),
              thumbnail: info.thumbnail,
              isLiveContent: info.is_live,
            },
          });
        },
      );
    });
  } catch (error) {
    if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);
    console.error('Erro no getDataVideo (yt-dlp):', error);
    return { erro: true };
  }
};

export const obterYTMP4 = async (
  url: string,
): Promise<{
  resultado?: {
    buffer: Buffer;
    title?: string;
    durationFormatted?: string;
    thumbnail?: string;
    isLiveContent?: boolean;
  };
  erro?: boolean;
}> => {
  const cookiesPath = getCookiesPath();
  const commonArgs = `PATH=$PATH:/home/hugo/.nvm/versions/node/v20.19.4/bin ${YTDLP_PATH} --no-update --cookies ${cookiesPath} --no-check-certificates --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --extractor-args "youtube:player_client=web,android_vr"`;
  try {
    // Pegar informações do vídeo
    const { stdout: infoJson } = await execAsync(`${commonArgs} -j "${url}"`);
    const info = JSON.parse(infoJson);

    // Baixar o vídeo para um arquivo temporário para garantir a muxagem correta (essencial para o WhatsApp)
    const tempVideoPath = getPathTemp('mp4');
    return new Promise((resolve) => {
      exec(
        `${commonArgs} -f "bv[vcodec^=avc1][height<=480]+ba[acodec^=mp4a]/b[vcodec^=avc1][height<=480]/best[height<=480]" -o "${tempVideoPath}" "${url}"`,
        { maxBuffer: 100 * 1024 * 1024 },
        async (error) => {
          if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);
          if (error) {
            console.error('Erro no yt-dlp (video):', error);
            if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
            return resolve({ erro: true });
          }

          try {
            const videoBuffer = fs.readFileSync(tempVideoPath);
            if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
            resolve({
              resultado: {
                buffer: videoBuffer,
                title: info.title,
                durationFormatted: convertSecondsToMinutes(info.duration),
                thumbnail: info.thumbnail,
                isLiveContent: info.is_live,
              },
            });
          } catch (readError) {
            console.error('Erro ao ler arquivo de vídeo:', readError);
            if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
            resolve({ erro: true });
          }
        },
      );
    });
  } catch (error) {
    if (fs.existsSync(cookiesPath)) fs.unlinkSync(cookiesPath);
    console.error('Erro no obterYTMP4 (yt-dlp):', error);
    return { erro: true };
  }
};
