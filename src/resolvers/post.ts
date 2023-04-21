// import { Post } from 'src/entities/Post';
import { Post } from '../entities/Post';
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { MyContext } from 'src/types';
import { isAuth } from '../middleware/isAuth';
import { AppDataSource } from '../app-data-source';
import { User } from '../entities/User';
import { Updoot } from '../entities/Updoot';

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
}

@Resolver(() => Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // the user has voted on the post before
    // and they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await AppDataSource.transaction(async (tm) => {
        await tm.query(
          `
          update updoot
          set value = $1
          where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!updoot) {
      // has never voted before
      await AppDataSource.transaction(async (tm) => {
        await tm.query(
          `
          insert into updoot ("userId", "postId", value)
          values ($1, $2, $3)
        `,
          [userId, postId, realValue]
        );

        await tm.query(
          `
          update post
          set points = points + $1
          where id = $2
      `,
          [realValue, postId]
        );
      });
    }
    return true;
  }

  @Query(() => [Post])
  async posts(
    @Arg('limit', () => Int!) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string
  ): Promise<Post[]> {
    const realLimt = Math.min(50, limit);

    const qb = AppDataSource.getRepository(Post)
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.user', 'user')
      .orderBy('p.createdAt', 'DESC')
      .take(realLimt);

    if (cursor) {
      qb.where('p."createdAt" < :cursor', {
        cursor: new Date(parseInt(cursor)),
      });
    }

    const posts = await qb.getMany();
    return posts;
  }
  @Query(() => Post, { nullable: true })
  post(@Arg('id') id: number): Promise<Post | null> {
    return Post.findOne({ where: { id } });
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    const newPost = Post.create({
      ...input,
      creatorId: req.session.userId,
    });
    const user = await User.findOne({
      where: { id: req.session.userId },
    });
    newPost.user = user ? user : new User();
    await AppDataSource.manager.save(newPost);
    // save user relation
    // return Post.create({
    //   ...input,
    //   creatorId: req.session.userId,
    // }).save();
    return newPost;
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg('id') id: number,
    @Arg('title', () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });
    if (!post) {
      return null;
    }
    if (typeof title !== 'undefined') {
      post.title = title;
      Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg('id') id: number): Promise<boolean> {
    await Post.delete({ id });
    return true;
  }
}
