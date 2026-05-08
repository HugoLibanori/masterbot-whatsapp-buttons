import { generateValidationKey } from '../services/LicenseService.js';
import pkg from 'sequelize';
const { Sequelize } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DATABASE || 'masterbot',
  process.env.DATABASE_USERNAME || 'root',
  process.env.DATABASE_PASSWORD || '',
  {
    host: process.env.DATABASE_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

async function fix() {
  try {
    const [results] = await sequelize.query("SELECT session_name FROM bot_licenses");
    
    for (const row of results as any[]) {
      const key = generateValidationKey(row.session_name);
      await sequelize.query(
        "UPDATE bot_licenses SET validation_key = ?, status = 'active' WHERE session_name = ?",
        { replacements: [key, row.session_name] }
      );
      console.log(`Chave corrigida para: ${row.session_name}`);
    }
    console.log("\x1b[32m%s\x1b[0m", "✅ Sistema liberado e licenças atualizadas!");
    process.exit(0);
  } catch (err) {
    console.error("Erro ao corrigir licenças:", err);
    process.exit(1);
  }
}

fix();
