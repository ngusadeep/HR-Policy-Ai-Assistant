import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env so this file can be used standalone by the TypeORM CLI
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * TypeORM CLI DataSource — used ONLY for migration generation and running.
 * The app itself uses DatabaseModule which reads from ConfigService.
 * synchronize is always false here.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'db',
  synchronize: false,
  logging: false,
  entities: [path.join(__dirname, '../**/*.entity.ts')],
  migrations: [path.join(__dirname, 'migrations/*.ts')],
});
