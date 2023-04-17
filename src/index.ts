import { MikroORM, RequestContext } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import microConfig from './mikro-orm.config';

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();
  await RequestContext.createAsync(orm.em, async () => {
    // inside this handler the `orm.em` will actually use the contextual fork, created via `RequestContext.createAsync()`
    const post = orm.em.create(Post, {
      title: 'my first post',
      createdAt: '',
      updatedAt: '',
    });
    await orm.em.persistAndFlush(post);
  });
};

main();

console.log('Hello World');
