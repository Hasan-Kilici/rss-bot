import {createFeed, getFeed, deleteFeed, editFeed, getChannels} from '../handlers/feeds.js';
import express from 'express';

const router = express.Router();

router.get('/', getFeed);
router.post('/', createFeed);
router.delete('/:id', deleteFeed);
router.put('/:id', editFeed);
router.get('/channels', getChannels);

export default router;