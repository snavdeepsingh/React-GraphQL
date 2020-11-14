import "reflect-metadata";
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import microConfig from './mikro-orm.config';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from "./resolvers/user";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from 'src/types';


const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up(); // runs the migrations before it gets anuthing up.
    
    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    app.use(
        session({
            name: 'qid',
            store: new RedisStore({
                client: redisClient,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 7, // 1 weeek
                httpOnly: true,
                sameSite: "lax",
                secure: __prod__// cookie only works in htps
            },
            saveUninitialized: false,
            secret: "qwoehroqewuroiquweoiru",
            resave: false,
        })
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [
                HelloResolver,
                PostResolver,
                UserResolver,
            ],
            validate: true
        }),
        context: ({req, res}): MyContext => ({ em: orm.em , req, res})
    })

    apolloServer.applyMiddleware({ app })
    app.listen(4000, () => {
        console.log('server listening on localhost:4000');
    })
};

main().catch(err => {
    console.log(err);
})