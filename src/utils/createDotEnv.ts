import fs from 'fs-extra';
import path from 'path';

import { textColor } from './utils.js';

export const createDotEnv = async () => {
  const env =
    '# CONFIGURAÇÃO PARA BANCO DE DADOS\n' +
    'DATABASE=BD_BOT\n' +
    'DATABASE_USERNAME=root\n' +
    'DATABASE_PASSWORD=123456\n' +
    'DATABASE_HOST=localhost\n' +
    'DATABASE_PORT=3306\n' +
    'DATABASE_DIALECT=mysql\n\n' +
    '# CONFIGURAÇÕES MYSQL\n' +
    'MYSQL_DATABASE=BD_BOT\n' +
    'MYSQL_ROOT_PASSWORD=123456\n' +
    'CONTAINER_NAME=Master_Bot';

  await fs.writeFile(path.resolve('.env'), env, 'utf-8');
  console.log(textColor('Arquivo .env criado com sucesso.', '#00ff00'));
  console.log(
    textColor(
      'Configure as informações do banco de dados antes de iniciar o bot.',
      '#00ff00',
    ),
  );
  process.exit(0);
};
