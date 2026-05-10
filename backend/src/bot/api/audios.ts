import * as googleTTS from 'google-tts-api';
import fs from 'fs';
import { exec } from 'child_process';
import { getPathTemp } from '../../utils/utils.js';

export const textoParaVoz = async (
  idioma: string,
  texto: string,
): Promise<{ resultado?: Buffer; erro?: string }> => {
  return new Promise(async (resolve) => {
    let tempMp3: string | null = null;
    let tempOgg: string | null = null;
    
    try {
      const base64Audio = await googleTTS.getAudioBase64(texto, {
        lang: idioma,
        slow: false,
        host: 'https://translate.google.com',
        timeout: 10000,
      });
      
      const bufferAudio = Buffer.from(base64Audio, 'base64');
      
      // Converter manualmente para ogg/opus para evitar bugs no Baileys
      tempMp3 = getPathTemp('mp3');
      tempOgg = getPathTemp('ogg');
      
      fs.writeFileSync(tempMp3, bufferAudio);
      
      exec(`ffmpeg -y -i ${tempMp3} -c:a libopus ${tempOgg}`, (error) => {
        if (error) {
          console.error('Erro no ffmpeg:', error);
          if (tempMp3 && fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
          if (tempOgg && fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg);
          return resolve({ erro: 'Erro ao converter o áudio.' });
        }
        
        try {
          const finalBuffer = fs.readFileSync(tempOgg!);
          if (tempMp3 && fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
          if (tempOgg && fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg);
          resolve({ resultado: finalBuffer });
        } catch (e) {
          if (tempMp3 && fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
          if (tempOgg && fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg);
          resolve({ erro: 'Erro ao ler áudio convertido.' });
        }
      });
      
    } catch (err: any) {
      console.log(`API textoParaVoz - ${err.message}`);
      if (tempMp3 && fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
      if (tempOgg && fs.existsSync(tempOgg)) fs.unlinkSync(tempOgg);
      resolve({ erro: 'Erro na conversão de texto para voz.' });
    }
  });
};
