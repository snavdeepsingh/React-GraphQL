import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import microConfig from './mikro-orm.config';
import express from 'express';

const main = async () => {
    const orm = await MikroORM.init(microConfig);
    await orm.getMigrator().up(); // runs the migrations before it gets anuthing up.
    
    const app = express();
    app.get('/', (_, res) => {
        res.send('HELLO WORLD');
    })
    app.listen(4000, () => {
        console.log('server listening on localhost:4000');
    })
};

main().catch(err => {
    console.log(err);
})