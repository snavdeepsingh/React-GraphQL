import "reflect-metadata";
import { MikroORM } from '@mikro-orm/core';
import { COOKIE_NAME, __prod__ } from './constants';
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
import cors from 'cors';
import { sendEmail } from "./utils/sendEmail";


const main = async () => {
    sendEmail('nav@nav.com', 'Hello there!');
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up(); // runs the migrations before it gets anuthing up.
    
    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();
    app.use(
        cors({
            origin: 'http://localhost:3000',
            credentials: true,
        })
    )

    app.use(
        session({
            name: COOKIE_NAME,
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
            validate: false
        }),
        context: ({req, res}) => ({ em: orm.em , req, res})
    })

    apolloServer.applyMiddleware({
        app,
        cors: false,
    })
    app.listen(4000, () => {
        console.log('server listening on localhost:4000');
    })
};

main().catch(err => {
    console.log(err);
})