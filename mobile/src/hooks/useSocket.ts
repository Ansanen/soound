import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  SOCKET_EVENTS,
  RoomState,
  SyncUpdatePayload,
  UserJoinedPayload,
  UserLeftPayload,
  QueueUpdatedPayload,
} from '../types';

const SERVER_URL = __DEV__ ? 'http://localhost:3000' : 'https://api.soound.xyz';

interface UseSocketOptions {
  onRoomState?: (state: RoomState) => void;
  onSyncUpdate?: (payload: SyncUpdatePayload) => void;
  onUserJoined?: (payload: UserJoinedPayload) => void;
  onUserLeft?: (payload: UserLeftPayload) => void;
  onQueueUpdated?: (payload: QueueUpdatedPayload) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[socket] connected:', socket.id);
    });

    socket.on(SOCKET_EVENTS.ROOM_STATE, (state: RoomState) => {
      optionsRef.current.onRoomState?.(state);
    });

    socket.on(SOCKET_EVENTS.SYNC_UPDATE, (payload: SyncUpdatePayload) => {
      optionsRef.current.onSyncUpdate?.(payload);
    });

    socket.on(SOCKET_EVENTS.ROOM_USER_JOINED, (payload: UserJoinedPayload) => {
      optionsRef.current.onUserJoined?.(payload);
    });

    socket.on(SOCKET_EVENTS.ROOM_USER_LEFT, (payload: UserLeftPayload) => {
      optionsRef.current.onUserLeft?.(payload);
    });

    socket.on(SOCKET_EVENTS.QUEUE_UPDATED, (payload: QueueUpdatedPayload) => {
      optionsRef.current.onQueueUpdated?.(payload);
    });

    socket.on('error', (err: any) => {
      console.error('[socket] error:', err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinRoom = useCallback((roomCode: string, userId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, userId });
  }, []);

  const leaveRoom = useCallback((roomCode: string, userId: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.ROOM_LEAVE, { roomCode, userId });
  }, []);

  const emitPlay = useCallback((roomCode: string, trackIndex: number, positionMs: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.SYNC_PLAY, { roomCode, trackIndex, positionMs });
  }, []);

  const emitPause = useCallback((roomCode: string, positionMs: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.SYNC_PAUSE, { roomCode, positionMs });
  }, []);

  const emitSeek = useCallback((roomCode: string, positionMs: number) => {
    socketRef.current?.emit(SOCKET_EVENTS.SYNC_SEEK, { roomCode, positionMs });
  }, []);

  const emitSkip = useCallback((roomCode: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.SYNC_SKIP, { roomCode });
  }, []);

  return {
    socket: socketRef,
    joinRoom,
    leaveRoom,
    emitPlay,
    emitPause,
    emitSeek,
    emitSkip,
  };
}
