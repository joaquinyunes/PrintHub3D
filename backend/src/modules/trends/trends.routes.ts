import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = Router();

const cache = new Map<string, any[]>();

async function scrapeTrends(query: string): Promise<any[]> {
  if (cache.has(query)) {
    return cache.get(query) || [];
  }

  try {
    const url = `https://duckduckgo.com/?q=${encodeURIComponent(query + ' 3d print')}&iax=images&ia=images`;
    
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(res.data);
    const results: any[] = [];

    $('img').each((i, el) => {
      if (i >= 10) return;
      
      const src = $(el).attr('src');
      const alt = $(el).attr('alt');
      
      if (src && src.startsWith('http') && !src.includes('duckduckgo')) {
        results.push({
          name: alt || query,
          imageUrl: src,
          category: query,
          price: 2000 + Math.floor(Math.random() * 3000)
        });
      }
    });

    await new Promise(r => setTimeout(r, 1000));

    if (results.length > 0) {
      cache.set(query, results);
    }

    return results;
  } catch (error) {
    console.error('Scraping error:', error);
    return [];
  }
}

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Query requerida' });
    }

    const results = await scrapeTrends(q as string);
    
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Error en búsqueda' });
  }
});

router.get('/trending', async (req, res) => {
  const trends = [
    'phone holder',
    'organizer drawer',
    'cable management',
    'lamparas 3d'
  ];

  const allResults: any[] = [];

  for (const trend of trends.slice(0, 2)) {
    const results = await scrapeTrends(trend);
    allResults.push(...results);
  }

  res.json(allResults.slice(0, 20));
});

router.get('/clear-cache', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache limpiado' });
});

export default router;