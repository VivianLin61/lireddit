import { Post } from './entities/Post';
import { Updoot } from './entities/Updoot';
import { User } from './entities/User';
import path from 'path';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  logging: true,
  url: process.env.DATABASE_URL,
  // synchronize: true,
  migrations: [path.join(__dirname, './migrations/*')],
  entities: [Post, User, Updoot],
});
