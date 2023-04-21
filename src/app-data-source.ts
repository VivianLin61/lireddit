import { Post } from './entities/Post';
import { Updoot } from './entities/Updoot';
import { User } from './entities/User';
import path from 'path';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  username: 'vivianlin',
  password: '',
  database: 'lireddit2',
  logging: true,
  synchronize: true,
  migrations: [path.join(__dirname, './migrations/*')],
  entities: [Post, User, Updoot],
});
