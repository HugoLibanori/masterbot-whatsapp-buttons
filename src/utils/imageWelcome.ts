// src/bot/utils/imagemBemVindo.ts
import { createCanvas, loadImage, registerFont } from 'canvas';
import axios from 'axios';
import * as path from 'path';

// Registrar fonte customizada
registerFont(path.resolve(process.cwd(), 'src/fonts/impact.ttf'), {
  family: 'impact',
});

export async function gerarImagemBemVindo(
  nome: string,
  nameGroup: string,
  urlFoto?: string,
): Promise<Buffer> {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext('2d');

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // Fundo
  const background = await loadImage(
    path.resolve('src', 'bot', 'midia', 'background.png'),
  );
  ctx.drawImage(background, 0, 0, canvasWidth, canvasHeight);

  // Foto de perfil
  let imgPerfil;
  try {
    const response = await axios.get(urlFoto!, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    imgPerfil = await loadImage(buffer);
  } catch {
    imgPerfil = await loadImage(
      path.resolve('src', 'bot', 'midia', 'usuariosemfoto.png'),
    );
  }

  const avatarSize = 120;
  const margin = 30;
  const maxTextWidth = 500;

  let texto1 = `Seja bem-vindo, ${nome}`;
  let texto2 = `ao grupo ${nameGroup.toUpperCase()}`;

  // Fonte base
  ctx.fillStyle = '#fff';
  let fontSize = 30;
  ctx.font = `${fontSize}px impact`;

  // Ajuste de tamanho se necessário
  while (
    ctx.measureText(texto1).width > maxTextWidth ||
    ctx.measureText(texto2).width > maxTextWidth
  ) {
    fontSize--;
    if (fontSize <= 18) break;
    ctx.font = `${fontSize}px impact`;
  }

  const texto1Width = ctx.measureText(texto1).width;

  // Usar negrito para o texto2 temporariamente para medir corretamente
  ctx.font = `bold ${fontSize}px impact`;
  const texto2Width = ctx.measureText(texto2).width;

  const larguraTotal = avatarSize + margin + Math.max(texto1Width, texto2Width);
  const startX = (canvasWidth - larguraTotal) / 2;

  const avatarX = startX;
  const avatarY = (canvasHeight - avatarSize) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(
    avatarX + avatarSize / 2,
    avatarY + avatarSize / 2,
    avatarSize / 2,
    0,
    Math.PI * 2,
    true,
  );
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(imgPerfil, avatarX, avatarY, avatarSize, avatarSize);
  ctx.restore();

  const textX = avatarX + avatarSize + margin;
  const textY1 = avatarY + avatarSize / 2 - 10;
  const textY2 = textY1 + 40;

  // Texto 1 - normal
  ctx.font = `${fontSize}px impact`;
  ctx.fillText(texto1, textX, textY1);

  // Texto 2 - negrito
  ctx.font = `bold ${fontSize}px impact`;
  ctx.fillText(texto2, textX, textY2);

  return canvas.toBuffer('image/png');
}
