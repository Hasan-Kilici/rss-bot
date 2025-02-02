import fs from 'fs';
import path from 'path';
import discord from '../bot/init.js';
export function createFeed(req, res) {
  const { title, url, channelId } = req.body;
  const newFeed = {
    id: Date.now(),
    title,
    url,
    channelId,
  };

  const filePath = path.resolve('feeds.json');
  
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Dosya okuma hatası' });
    }
    
    const feeds = JSON.parse(data);
    feeds.push(newFeed);

    fs.writeFile(filePath, JSON.stringify(feeds, null, 2), 'utf-8', (err) => {
      if (err) {
        return res.status(500).json({ message: 'Feed eklenemedi' });
      }
      res.status(201).json(newFeed);
    });
  });
}

export function deleteFeed(req, res) {
    const { id } = req.params;
  
    const filePath = path.resolve('feeds.json');
    
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        return res.status(500).json({ message: 'Dosya okuma hatası' });
      }
  
      let feeds = JSON.parse(data);
      feeds = feeds.filter(feed => feed.id !== parseInt(id));
  
      fs.writeFile(filePath, JSON.stringify(feeds, null, 2), 'utf-8', (err) => {
        if (err) {
          return res.status(500).json({ message: 'Feed silinemedi' });
        }
        res.status(200).json({ message: 'Feed başarıyla silindi' });
      });
    });
}

export function editFeed(req, res) {
    const { id } = req.params;
    const { title, url } = req.body;
  
    const filePath = path.resolve('feeds.json');
    
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        return res.status(500).json({ message: 'Dosya okuma hatası' });
      }
  
      let feeds = JSON.parse(data);
      const feedIndex = feeds.findIndex(feed => feed.id === parseInt(id));
  
      if (feedIndex === -1) {
        return res.status(404).json({ message: 'Feed bulunamadı' });
      }
  
      if (title) feeds[feedIndex].title = title;
      if (url) feeds[feedIndex].url = url;
  
      fs.writeFile(filePath, JSON.stringify(feeds, null, 2), 'utf-8', (err) => {
        if (err) {
          return res.status(500).json({ message: 'Feed güncellenemedi' });
        }
        res.status(200).json(feeds[feedIndex]);
      });
    });
  }

  export function getFeed(req, res) {
    const filePath = path.resolve('feeds.json');
    
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        return res.status(500).json({ message: 'Dosya okuma hatası' });
      }
  
      const feeds = JSON.parse(data);
      res.status(200).json(feeds);
    });
  }

  export async function getChannels(req,res) {
    const data = await discord.guilds.cache.get(process.env.guild_id).channels.fetch()
    res.status(200).json(data.filter(channel => channel.type === 0));
  }