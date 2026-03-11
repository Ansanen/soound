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
  try {
    const { stdout, stderr } = await execFileAsync('yt-dlp', [
      '--no-check-certificates',
      '-f', 'bestaudio[ext=m4a]/bestaudio',
      '--get-url',
      '--no-warnings',
      `https://www.youtube.com/watch?v=${youtubeId}`,
    ], { timeout: 30000 });

    if (stderr) console.log('[yt-dlp stderr]:', stderr.substring(0, 500));

    const url = stdout.trim();
    if (!url || !url.startsWith('http')) {
      throw new Error(`yt-dlp returned invalid URL: ${url.substring(0, 100)}`);
    }

    // Cache the URL
    urlCache.set(youtubeId, { url, expires: Date.now() + CACHE_TTL });
    return url;
  } catch (err: any) {
    console.error('[yt-dlp error]:', err.message?.substring(0, 500));
    if (err.stderr) console.error('[yt-dlp stderr]:', err.stderr?.substring(0, 500));
    throw new Error(`yt-dlp failed: ${err.message?.substring(0, 200)}`);
  }
}

export async function searchRoutes(app: FastifyInstance) {
  // Debug endpoint to check yt-dlp
  app.get('/api/debug/ytdlp', async (req, reply) => {
    try {
      const { stdout: version } = await execFileAsync('yt-dlp', ['--version'], { timeout: 5000 });
      let testResult = '';
      try {
        const { stdout, stderr } = await execFileAsync('yt-dlp', [
          '--no-check-certificates',
          '-f', 'bestaudio[ext=m4a]/bestaudio',
          '--get-url',
          '--no-warnings',
          '--verbose',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ], { timeout: 30000 });
        testResult = `stdout: ${stdout.substring(0, 200)}\nstderr: ${stderr.substring(0, 500)}`;
      } catch (e: any) {
        testResult = `error: ${e.message?.substring(0, 200)}\nstderr: ${e.stderr?.substring(0, 500)}`;
      }
      return {
        version: version.trim(),
        deno: await execFileAsync('deno', ['--version'], { timeout: 5000 }).then(r => r.stdout.trim()).catch(() => 'not found'),
        testResult,
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
