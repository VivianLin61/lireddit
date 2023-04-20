import { Post } from './entities/Post';
import { User } from './entities/User';

import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  username: 'vivianlin',
  password: '',
  database: 'lireddit2',
  logging: true,
  synchronize: true,
  entities: [Post, User],
});
