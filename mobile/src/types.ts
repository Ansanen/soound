// ═══════════════════════════════════════
// soound — Shared Types
// ═══════════════════════════════════════

export interface User {
  id: string;
  username: string;
  createdAt: number;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  isActive: boolean;
  createdAt: number;
}

export interface Track {
  id: string;
  youtubeId: string;
  title: string;
  artist: string;
  duration: number; // seconds
  addedBy: string;
  position: number;
}

export interface SyncState {
  isPlaying: boolean;
  trackIndex: number;
  positionMs: number;
  serverTimestamp: number;
}

export interface RoomState {
  room: Room;
  participants: User[];
  queue: Track[];
  syncState: SyncState;
}

export interface Rewards {
  userId: string;
  minutesListened: number;
  roomsHosted: number;
  friendsInvited: number;
  totalPoints: number;
}

// ── Socket.io Event Payloads ──

export interface JoinRoomPayload {
  roomCode: string;
  userId: string;
}

export interface LeaveRoomPayload {
  roomCode: string;
  userId: string;
}

export interface SyncPlayPayload {
  roomCode: string;
  trackIndex: number;
  positionMs: number;
}

export interface SyncPausePayload {
  roomCode: string;
  positionMs: number;
}

export interface SyncSeekPayload {
  roomCode: string;
  positionMs: number;
}

export interface SyncSkipPayload {
  roomCode: string;
}

export interface SyncUpdatePayload {
  isPlaying: boolean;
  trackIndex: number;
  positionMs: number;
  serverTimestamp: number;
}

export interface QueueUpdatedPayload {
  queue: Track[];
}

export interface UserJoinedPayload {
  user: User;
}

export interface UserLeftPayload {
  userId: string;
}

// ── Socket Event Names ──

export const SOCKET_EVENTS = {
  // Client → Server
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  SYNC_PLAY: 'sync:play',
  SYNC_PAUSE: 'sync:pause',
  SYNC_SEEK: 'sync:seek',
  SYNC_SKIP: 'sync:skip',

  // Server → Client
  ROOM_STATE: 'room:state',
  ROOM_USER_JOINED: 'room:user-joined',
  ROOM_USER_LEFT: 'room:user-left',
  SYNC_UPDATE: 'sync:update',
  QUEUE_UPDATED: 'queue:updated',
} as const;
