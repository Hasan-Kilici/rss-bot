import axios from 'axios';
import sqlite3 from 'better-sqlite3';
import fs from 'node:fs';
import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { EmbedBuilder } from 'discord.js';
import discordClient from '../bot/init.js';
import MarkdownIt from 'markdown-it';

const md = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).disable(['link', 'image'])
  .enable(['link'])
  .enable('image');

const db = new sqlite3('feeds.db');
db.prepare(`CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  etag TEXT
)`).run();

const feedsConfig = JSON.parse(fs.readFileSync('feeds.json', 'utf8'));
const parser = new XMLParser();

async function fetchFeed(url, channelId) {
    const row = db.prepare('SELECT etag FROM feeds WHERE id = ?').get(url);
    const headers = {};
    if (row) headers['If-None-Match'] = row.etag;

    const response = await axios.get(url, { headers, validateStatus: status => status < 500 });
    if (response.status === 304) return;

    const etag = response.headers['etag'];
    if (etag) {
        db.prepare('INSERT INTO feeds (id, etag) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET etag = ?')
          .run(url, etag, etag);
    }

    const jsonData = parser.parse(response.data);
    const feed = jsonData.rss?.channel || jsonData.feed;
    if (!feed?.item) return;

    const items = Array.isArray(feed.item) ? feed.item : [feed.item];

    for (const item of items) {
        const title = item.title || "Başlık Yok";
        const link = item.link || url;
        const description = item.description || item.summary || "Açıklama Yok";
        const date = item.pubDate || item.updated || item.published || null;

        const postId = crypto.createHash('md5').update(title + link).digest('hex');
        const existingPost = db.prepare('SELECT * FROM feeds WHERE id = ?').get(postId);
        if (existingPost) {
            console.log(`Bu haber zaten gönderilmiş: ${postId}`);
            continue;
        } else {
            db.prepare('INSERT INTO feeds (id, etag) VALUES (?, ?)').run(postId, etag || "");
        }

        const cleanDescription = md.render(description).replace(/<[^>]*>/g, '');
        
        const imageUrl = item['media:content']?.[0]?.url || item['enclosure']?.url || item['image']?.url;

        const embed = new EmbedBuilder()
          .setImage(imageUrl)
          .setTitle(title)
          .setDescription(cleanDescription.length > 3000 ? cleanDescription.substring(0, 2997) + "..." : cleanDescription)
          .setColor(0x0099ff)
          .setURL(link)
          .setTimestamp(date ? new Date(date) : new Date());

        const channel = discordClient.channels.cache.get(channelId);
        if (channel) {
            await channel.send({ embeds: [embed] });
        }
    }
}

export async function fetchAllFeeds() {
    for (const { url, channelId } of feedsConfig) {
      await fetchFeed(url, channelId);
    }
}
