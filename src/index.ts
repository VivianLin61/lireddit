import 'reflect-metadata';
import { COOKIE_NAME, __prod__ } from './constants';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import RedisStore from 'connect-redis';
import session from 'express-session';
import { MyContext } from './types';
import Redis from 'ioredis';
import cors from 'cors';
import { AppDataSource } from './app-data-source';
// import { Post } from './entities/Post';

const main = async () => {
  AppDataSource.initialize()
    .then(async () => {
      await AppDataSource.runMigrations();
      console.log('Data Source has been initialized!');
    })
    .catch((err) => {
      console.error('Error during Data Source initialization', err);
    });

  const app = express();
  // Initialize client.

  const redis = new Redis();

  app.set('trust proxy', 1);
  app.use(
    cors({
      origin: 'http://localhost:3000',
      credentials: true,
    })
  );
  // Initialize store.
  let redisStore = new RedisStore({
    client: redis,
    disableTouch: true,
    prefix: 'myapp:',
  });

  // Initialize sesssion storage.

  app.use(
    session({
      name: COOKIE_NAME,
      store: redisStore,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        sameSite: 'lax', // csrf
        httpOnly: true,
        secure: __prod__, // cookie only works in https
      },
      resave: false, // required: force lightweight session keep alive (touch)
      saveUninitialized: false, // recommended: only save session when data exists
      secret: 'safjaldfjlkjcjiojeqw',
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],

      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ req, res, redis }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: ['http://localhost:3000'],
      credentials: true,
    },
  });

  app.listen(4000, () => {
    console.log('server started on localhost:4000');
  });
};

main();

console.log('Hello World');
