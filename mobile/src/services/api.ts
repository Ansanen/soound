const RAILWAY_URL = 'https://soound-dbpath-appdatasoounddb.up.railway.app';
const API_URL = __DEV__ ? RAILWAY_URL : RAILWAY_URL;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Users
  createUser: (username: string) =>
    request('/api/users', { method: 'POST', body: JSON.stringify({ username }) }),

  // Rooms
  createRoom: (name: string, hostId: string) =>
    request('/api/rooms', { method: 'POST', body: JSON.stringify({ name, hostId }) }),

  getRoom: (code: string) =>
    request(`/api/rooms/${code}`),

  getQueue: (code: string) =>
    request(`/api/rooms/${code}/queue`),

  addToQueue: (code: string, track: { youtubeId: string; title: string; artist: string; duration: number; addedBy: string }) =>
    request(`/api/rooms/${code}/queue`, { method: 'POST', body: JSON.stringify(track) }),

  // Search
  search: (query: string) =>
    request(`/api/search?q=${encodeURIComponent(query)}`),

  // Stream URL (proxy through server)
  getStreamUrl: (youtubeId: string) =>
    `${API_URL}/api/stream/${youtubeId}`,

  // Get direct audio URL from YouTube (resolved server-side)
  getAudioUrl: (youtubeId: string) =>
    request<{ url: string }>(`/api/audio-url/${youtubeId}`),

  // Rewards
  getRewards: (userId: string) =>
    request(`/api/rewards/${userId}`),

  recordListening: (userId: string, minutes: number, roomSize: number) =>
    request(`/api/rewards/${userId}/listen`, {
      method: 'POST',
      body: JSON.stringify({ minutes, roomSize }),
    }),
};
