import { Options, Dialect } from "sequelize";
import "dotenv/config";

const dialect: Dialect = (process.env.DATABASE_DIALECT as Dialect) || "mysql";

const config: Options = {
  dialect,
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: Number(process.env.DATABASE_PORT) || 3306,
  username: process.env.DATABASE_USERNAME || "root",
  password: process.env.DATABASE_PASSWORD || "123456",
  database: process.env.DATABASE || "BD_BOT",
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
  dialectOptions: {
    timezone: "-03:00",
  },
  timezone: "-03:00",
};

export default config;
