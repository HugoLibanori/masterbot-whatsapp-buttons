import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';

import { Command } from '../../interfaces/Command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = new Map<string, Command>();

const loadCommands = async (baseDir: string) => {
  const categorys = fs.readdirSync(baseDir);

  for (const category of categorys) {
    const categoryPath = path.join(baseDir, category);
    const statCategory = fs.statSync(categoryPath);
    if (!statCategory.isDirectory()) continue;

    const files = fs.readdirSync(categoryPath);

    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
      if (file.startsWith('_')) continue;

      const commandName = file.replace(/\.(ts|js)$/, '');
      const filePath = path.join(categoryPath, file);
      const fileUrl = pathToFileURL(filePath).href;

      try {
        const module = await import(fileUrl);
        const command = module.default as Command;

        if (!command?.exec || typeof command.exec !== 'function') {
          console.warn(`❌ Comando ${commandName} inválido ou sem método exec`);
          continue;
        }

        commands.set(commandName, {
          name: commandName,
          description: command.description || 'Sem descrição',
          minType: command.minType,
          aliases: command.aliases || [],
          group: command.group || false,
          admin: command.admin || false,
          owner: command.owner || false,
          isBotAdmin: command.isBotAdmin || false,
          category: category,
          exec: command.exec,
        });
      } catch (err) {
        console.error(`❌ Erro ao carregar comando ${commandName}:`, err);
      }
    }
  }
};

await loadCommands(__dirname);

export default commands;
