import { generateValidationKey } from '../services/LicenseService.js';
import dotenv from 'dotenv';
dotenv.config();

const sessionName = process.argv[2];

if (!sessionName) {
  console.log('\x1b[31m%s\x1b[0m', 'Erro: Você deve fornecer o nome da sessão.');
  console.log('Uso: npm run license:gen <nome_da_sessão>');
  process.exit(1);
}

const key = generateValidationKey(sessionName);

console.log('\n\x1b[32m%s\x1b[0m', '✅ LICENÇA GERADA COM SUCESSO');
console.log('-----------------------------------');
console.log(`Sessão: ${sessionName}`);
console.log(`Chave de Validação: \x1b[33m${key}\x1b[0m`);
console.log('-----------------------------------');
console.log('Insira esta chave no campo "validation_key" da tabela "bot_licenses".\n');
