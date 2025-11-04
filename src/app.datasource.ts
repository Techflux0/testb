import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mongodb',
  url: process.env.MONGO_URI,
  ssl: true,
  sslValidate: true,
  authSource: 'admin',
  synchronize: false,
  logging: false,
  database: process.env.MONGO_DB_NAME,
});
