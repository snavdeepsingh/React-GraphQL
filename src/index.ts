import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import microConfig from './mikro-orm.config';

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up(); // runs the migrations before it gets anuthing up.
    const post = await orm.em.create(Post, { title: 'My First Post' });
    await orm.em.persistAndFlush(post);
    // const posts = await orm.em.find(Post, {});
    console.log(post);
};

main();