import { Arg, Int, Mutation, Query, Resolver, InputType, Field, Ctx, UseMiddleware, FieldResolver, Root, ObjectType } from 'type-graphql';
import { Post } from '../entities/Post';
import { MyContext } from 'src/types';
import { isAuth } from '../middleware/isAuth';
import { getConnection } from 'typeorm';
import { Updoot } from '../entities/Updoot';
import { User } from '../entities/User';

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
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(
    @Root() post: Post,
    @Ctx() {userLoader} : MyContext
  ) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() {req, updootLoader}: MyContext
  ) {

    if (!req.session.userId) {
      return null;
    }

    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId
    });

    return updoot ? updoot.value : null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => Int) postId: number,
    @Arg('value', () => Int) value: number,
    @Ctx() {req}: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;
    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // the user has voted on the post before and they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async tm => {
        await tm.query(`
          UPDATE updoot 
          SET value = $1
          WHERE "postId" = $2 AND "userId" = $3
        `, [realValue, postId, userId]);

        await tm.query(
          `UPDATE post 
          SET points = points + $1
          WHERE id = $2`,
          [ 2 * realValue, postId]
        );
      })
    } else if (!updoot) {
      // has never voted before
      await getConnection().transaction(async tm => {
        await tm.query(`
          INSERT INTO updoot ("userId", "postId", value)
          VALUES (${userId}, ${postId}, ${realValue});
        `);
        await tm.query(`
          UPDATE post
          SET points = points + ${realValue}
          WHERE id = ${postId};
        `)
      })
    }
    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string,
  ): Promise<PaginatedPosts>{
    // 20 -> 21
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(cursor));
    }

    const posts = await getConnection().query(`
    SELECT p.*
    FROM post p
    ${cursor ? `WHERE p."createdAt" < $2` : ''}
    ORDER BY p."createdAt" DESC
    limit $1
    `, replacements)

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne
    }
  }

  @Query(() => Post, { nullable: true})
  post(
    @Arg('id', () => Int) id: number,
  ): Promise <Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req } : MyContext,
  ): Promise<Post> {
    // 2 sequel queries
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext,
  ): Promise<Post | null>{
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId
      })
      .returning('*')
      .execute();
    
    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('id', () => Int) id: number,
    @Ctx() {req} : MyContext,
  ): Promise<Boolean> {
    // Not cascade way to delete posts 
    // const post = await Post.findOne(id)
    // if (!post) {
    //   return false
    // }

    // if (post.creatorId !== req.session.userId) {
    //   throw new Error('not authorized');
    // }
    // await Updoot.delete({ postId: id });
    // await Post.delete({ id, creatorId: req.session.userId})


    // Below is the code to delete it CASCADE way.
    await Post.delete({ id, creatorId: req.session.userId});
    return true;
  }
}