import { Server, Socket } from 'socket.io';
import db from '../db/index.js';
import {
  SOCKET_EVENTS,
  JoinRoomPayload,
  LeaveRoomPayload,
  SyncPlayPayload,
  SyncPausePayload,
  SyncSeekPayload,
  SyncSkipPayload,
  SyncState,
} from '@soound/shared';

// In-memory room sync states
const roomSyncStates = new Map<string, SyncState>();

// Map socket.id → { roomCode, userId }
const socketRooms = new Map<string, { roomCode: string; userId: string }>();

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ── Join Room ──
    socket.on(SOCKET_EVENTS.ROOM_JOIN, (payload: JoinRoomPayload) => {
      const { roomCode, userId } = payload;
      const room = db.prepare('SELECT * FROM rooms WHERE code = ? AND is_active = 1').get(roomCode) as any;
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.join(roomCode);
      socketRooms.set(socket.id, { roomCode, userId });

      // Add to db participants
      db.prepare('INSERT OR IGNORE INTO room_participants (room_id, user_id) VALUES (?, ?)').run(room.id, userId);

      // Get current state
      const participants = db.prepare(`
        SELECT u.* FROM users u
        JOIN room_participants rp ON rp.user_id = u.id
        WHERE rp.room_id = ?
      `).all(room.id);

      const queue = db.prepare('SELECT * FROM queue WHERE room_id = ? ORDER BY position ASC').all(room.id);

      const syncState = roomSyncStates.get(roomCode) || {
        isPlaying: false,
        trackIndex: 0,
        positionMs: 0,
        serverTimestamp: Date.now(),
      };

      // Send full state to joining client
      socket.emit(SOCKET_EVENTS.ROOM_STATE, {
        room,
        participants,
        queue,
        syncState,
      });

      // Notify others
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      socket.to(roomCode).emit(SOCKET_EVENTS.ROOM_USER_JOINED, { user });

      console.log(`[socket] ${userId} joined room ${roomCode}`);
    });

    // ── Leave Room ──
    socket.on(SOCKET_EVENTS.ROOM_LEAVE, (payload: LeaveRoomPayload) => {
      handleLeave(socket, payload.roomCode, payload.userId);
    });

    // ── Sync: Play ──
    socket.on(SOCKET_EVENTS.SYNC_PLAY, (payload: SyncPlayPayload) => {
      const { roomCode, trackIndex, positionMs } = payload;
      const syncState: SyncState = {
        isPlaying: true,
        trackIndex,
        positionMs,
        serverTimestamp: Date.now(),
      };
      roomSyncStates.set(roomCode, syncState);

      // Broadcast to all in room (including sender for confirmation)
      io.to(roomCode).emit(SOCKET_EVENTS.SYNC_UPDATE, syncState);
    });

    // ── Sync: Pause ──
    socket.on(SOCKET_EVENTS.SYNC_PAUSE, (payload: SyncPausePayload) => {
      const { roomCode, positionMs } = payload;
      const existing = roomSyncStates.get(roomCode);
      const syncState: SyncState = {
        isPlaying: false,
        trackIndex: existing?.trackIndex ?? 0,
        positionMs,
        serverTimestamp: Date.now(),
      };
      roomSyncStates.set(roomCode, syncState);
      io.to(roomCode).emit(SOCKET_EVENTS.SYNC_UPDATE, syncState);
    });

    // ── Sync: Seek ──
    socket.on(SOCKET_EVENTS.SYNC_SEEK, (payload: SyncSeekPayload) => {
      const { roomCode, positionMs } = payload;
      const existing = roomSyncStates.get(roomCode);
      const syncState: SyncState = {
        isPlaying: existing?.isPlaying ?? false,
        trackIndex: existing?.trackIndex ?? 0,
        positionMs,
        serverTimestamp: Date.now(),
      };
      roomSyncStates.set(roomCode, syncState);
      io.to(roomCode).emit(SOCKET_EVENTS.SYNC_UPDATE, syncState);
    });

    // ── Sync: Skip ──
    socket.on(SOCKET_EVENTS.SYNC_SKIP, (payload: SyncSkipPayload) => {
      const { roomCode } = payload;
      const existing = roomSyncStates.get(roomCode);
      const syncState: SyncState = {
        isPlaying: true,
        trackIndex: (existing?.trackIndex ?? 0) + 1,
        positionMs: 0,
        serverTimestamp: Date.now(),
      };
      roomSyncStates.set(roomCode, syncState);
      io.to(roomCode).emit(SOCKET_EVENTS.SYNC_UPDATE, syncState);
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      const info = socketRooms.get(socket.id);
      if (info) {
        handleLeave(socket, info.roomCode, info.userId);
      }
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });
}

function handleLeave(socket: Socket, roomCode: string, userId: string) {
  socket.leave(roomCode);
  socketRooms.delete(socket.id);

  const room = db.prepare('SELECT id FROM rooms WHERE code = ?').get(roomCode) as any;
  if (room) {
    db.prepare('DELETE FROM room_participants WHERE room_id = ? AND user_id = ?').run(room.id, userId);
  }

  socket.to(roomCode).emit(SOCKET_EVENTS.ROOM_USER_LEFT, { userId });
}
