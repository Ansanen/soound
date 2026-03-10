import { FastifyInstance } from 'fastify';
import play from 'play-dl';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Cache audio URLs for 30 minutes (YouTube URLs expire after ~6 hours)
const urlCache = new Map<string, { url: string; expires: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

async function getAudioUrl(youtubeId: string): Promise<string> {
  // Check cache
  const cached = urlCache.get(youtubeId);
  if (cached && cached.expires > Date.now()) {
    return cached.url;
  }

  // Use yt-dlp to get the direct audio URL
  const { stdout } = await execFileAsync('yt-dlp', [
    '--no-check-certificates',
    '-f', 'bestaudio[ext=m4a]/bestaudio',
    '--get-url',
    `https://www.youtube.com/watch?v=${youtubeId}`,
  ], { timeout: 15000 });

  const url = stdout.trim();
  if (!url || !url.startsWith('http')) {
    throw new Error('Failed to extract audio URL');
  }

  // Cache the URL
  urlCache.set(youtubeId, { url, expires: Date.now() + CACHE_TTL });

  return url;
}

export async function searchRoutes(app: FastifyInstance) {
  // YouTube search (still using play-dl which works for search)
  app.get('/api/search', async (req, reply) => {
    const { q } = req.query as { q: string };
    if (!q?.trim()) {
      return reply.status(400).send({ error: 'Query is required' });
    }
    try {
      const results = await play.search(q, { limit: 10, source: { youtube: 'video' } });
      return results.map(r => ({
        youtubeId: r.id,
        title: r.title || '',
        artist: r.channel?.name || '',
        duration: r.durationInSec || 0,
        thumbnail: r.thumbnails?.[0]?.url || '',
      }));
    } catch (err) {
      console.error('Search error:', err);
      return reply.status(500).send({ error: 'Search failed' });
    }
  });

  // Get direct audio URL (for the client to play directly)
  app.get('/api/audio-url/:youtubeId', async (req, reply) => {
    const { youtubeId } = req.params as { youtubeId: string };
    try {
      const url = await getAudioUrl(youtubeId);
      return { url };
    } catch (err) {
      console.error('Audio URL error:', err);
      return reply.status(500).send({ error: 'Failed to get audio URL' });
    }
  });

  // Audio stream proxy — proxies audio through our server to avoid CORS issues
  app.get('/api/stream/:youtubeId', async (req, reply) => {
    const { youtubeId } = req.params as { youtubeId: string };
    try {
      const audioUrl = await getAudioUrl(youtubeId);

      // Use fetch which auto-follows redirects
      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0',
      };
      if (req.headers.range) {
        fetchHeaders['Range'] = req.headers.range as string;
      }

      const proxyRes = await fetch(audioUrl, { headers: fetchHeaders });

      const resHeaders: Record<string, string> = {
        'Content-Type': proxyRes.headers.get('content-type') || 'audio/mp4',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      };
      const contentLength = proxyRes.headers.get('content-length');
      if (contentLength) resHeaders['Content-Length'] = contentLength;
      const contentRange = proxyRes.headers.get('content-range');
      if (contentRange) resHeaders['Content-Range'] = contentRange;

      reply.raw.writeHead(proxyRes.status, resHeaders);

      if (proxyRes.body) {
        // @ts-ignore - Node.js ReadableStream to Node stream pipe
        const reader = proxyRes.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            reply.raw.write(value);
          }
          reply.raw.end();
        };
        pump().catch((err) => {
          console.error('Stream pump error:', err);
          reply.raw.end();
        });
      } else {
        reply.raw.end();
      }

      return reply;
    } catch (err) {
      console.error('Stream error:', err);
      return reply.status(500).send({ error: 'Stream failed' });
    }
  });
}
