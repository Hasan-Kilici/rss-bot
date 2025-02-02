import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import bot from './bot/init.js';
import { fetchAllFeeds } from './feeds/fetch.js';

import feedsRoutes from './routes/feeds.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/feeds', feedsRoutes);

app.listen(process.env.port, () => {
    console.log('Server is running on port 3000');
});

setInterval(fetchAllFeeds, 5000);
bot.login(process.env.token);