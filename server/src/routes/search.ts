import { FastifyInstance } from 'fastify';
import play from 'play-dl';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Cache audio URLs for 30 minutes (YouTube URLs expire after ~6 hours)
const urlCache = new Map<string, { url: string; expires: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// Player clients to try in order — some videos block certain clients
const PLAYER_CLIENTS = ['web_creator', 'mediaconnect', 'web', 'android'];

async function tryYtDlp(youtubeId: string, playerClient: string): Promise<string> {
  const args = [
    '--no-check-certificates',
    '-f', 'bestaudio[ext=m4a]/bestaudio/best',
    '--get-url',
    '--no-warnings',
    '--extractor-args', `youtube:player_client=${playerClient}`,
    `https://www.youtube.com/watch?v=${youtubeId}`,
  ];

  const { stdout, stderr } = await execFileAsync('yt-dlp', args, { timeout: 30000 });
  if (stderr) console.log(`[yt-dlp ${playerClient} stderr]:`, stderr.substring(0, 300));

  const url = stdout.trim().split('\n')[0]; // Take first URL if multiple
  if (!url || !url.startsWith('http')) {
    throw new Error(`Invalid URL from ${playerClient}: ${url?.substring(0, 80)}`);
  }
  return url;
}

async function getAudioUrl(youtubeId: string): Promise<string> {
  // Check cache
  const cached = urlCache.get(youtubeId);
  if (cached && cached.expires > Date.now()) {
    return cached.url;
  }

  // Try different player clients until one works
  let lastError: Error | null = null;
  for (const client of PLAYER_CLIENTS) {
    try {
      console.log(`[yt-dlp] trying ${client} for ${youtubeId}`);
      const url = await tryYtDlp(youtubeId, client);
      console.log(`[yt-dlp] success with ${client}`);
      urlCache.set(youtubeId, { url, expires: Date.now() + CACHE_TTL });
      return url;
    } catch (err: any) {
      lastError = err;
      console.log(`[yt-dlp] ${client} failed: ${err.message?.substring(0, 150)}`);
    }
  }

  console.error('[yt-dlp] all clients failed for', youtubeId);
  throw new Error(`yt-dlp failed with all clients: ${lastError?.message?.substring(0, 200)}`);
}

export async function searchRoutes(app: FastifyInstance) {
  // Debug endpoint to check yt-dlp
  app.get('/api/debug/ytdlp', async (req, reply) => {
    const { id } = req.query as { id?: string };
    const testId = id || 'dQw4w9WgXcQ';
    try {
      const { stdout: version } = await execFileAsync('yt-dlp', ['--version'], { timeout: 5000 });
      const results: Record<string, string> = {};
      for (const client of PLAYER_CLIENTS) {
        try {
          const url = await tryYtDlp(testId, client);
          results[client] = `OK: ${url.substring(0, 80)}...`;
        } catch (e: any) {
          results[client] = `FAIL: ${e.message?.substring(0, 150)}`;
        }
      }
      return {
        version: version.trim(),
        testVideoId: testId,
        clients: results,
      };
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });

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
    } catch (err: any) {
      console.error('Audio URL error:', err);
      return reply.status(500).send({ error: err.message || 'Failed to get audio URL' });
    }
  });

  // Audio stream — redirects to direct YouTube audio URL
  // iOS AVPlayer and web Audio both handle redirects natively
  app.get('/api/stream/:youtubeId', async (req, reply) => {
    const { youtubeId } = req.params as { youtubeId: string };
    try {
      const audioUrl = await getAudioUrl(youtubeId);
      return reply.redirect(302, audioUrl);
    } catch (err) {
      console.error('Stream error:', err);
      return reply.status(500).send({ error: 'Stream failed' });
    }
  });
}
