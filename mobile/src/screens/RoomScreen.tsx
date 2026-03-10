import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { User, Track, RoomState, SyncUpdatePayload } from '../types';
import { colors, spacing, radius, fonts } from '../theme';
import { useSocket } from '../hooks/useSocket';
import { useSyncPlayer } from '../hooks/useSyncPlayer';
import { api } from '../services/api';
import MusicPlayer from '../components/MusicPlayer';
import SearchMusic from '../components/SearchMusic';
import ParticipantsList from '../components/ParticipantsList';
import InviteModal from '../components/InviteModal';
import PartyOverlay from '../components/PartyOverlay';
import type { RootStackParamList } from '../../App';
import { UserContext } from '../../App';

type RoomRouteProp = RouteProp<RootStackParamList, 'Room'>;

export default function RoomScreen() {
  const route = useRoute<RoomRouteProp>();
  const nav = useNavigation();
  const { userId } = useContext(UserContext);
  const { roomCode, roomName, isHost } = route.params;

  const [participants, setParticipants] = useState<User[]>([]);
  const [queue, setQueue] = useState<Track[]>([]);
  const [hostId, setHostId] = useState('');
  const [inviteVisible, setInviteVisible] = useState(false);
  const [partyMode, setPartyMode] = useState(false);

  const player = useSyncPlayer({ queue, isHost, roomCode });

  const {
    joinRoom, leaveRoom, emitPlay, emitPause, emitSeek, emitSkip,
  } = useSocket({
    onRoomState: (state: RoomState) => {
      setParticipants(state.participants);
      setQueue(state.queue);
      setHostId(state.room.hostId);
      player.handleSyncUpdate(state.syncState);
    },
    onSyncUpdate: (payload: SyncUpdatePayload) => {
      player.handleSyncUpdate(payload);
    },
    onUserJoined: ({ user }) => {
      setParticipants(prev => [...prev.filter(p => p.id !== user.id), user]);
    },
    onUserLeft: ({ userId: uid }) => {
      setParticipants(prev => prev.filter(p => p.id !== uid));
    },
    onQueueUpdated: ({ queue: q }) => {
      setQueue(q);
    },
  });

  useEffect(() => {
    const uid = userId || 'demo-user';
    joinRoom(roomCode, uid);
    return () => { leaveRoom(roomCode, uid); };
  }, [roomCode, userId]);

  const handlePlay = useCallback(() => {
    player.play();
    if (isHost) emitPlay(roomCode, player.currentTrackIndex, player.positionMs);
  }, [isHost, roomCode, player]);

  const handlePause = useCallback(() => {
    player.pause();
    if (isHost) emitPause(roomCode, player.positionMs);
  }, [isHost, roomCode, player]);

  const handleSkip = useCallback(() => {
    player.skip();
    if (isHost) emitSkip(roomCode);
  }, [isHost, roomCode, player]);

  const handleAddTrack = useCallback(async (track: any) => {
    const newTrack: Track = {
      id: Date.now().toString(),
      youtubeId: track.youtubeId,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      addedBy: userId || 'demo-user',
      position: queue.length,
    };
    const isFirstTrack = queue.length === 0;
    const newQueue = [...queue, newTrack];
    setQueue(newQueue);

    // Auto-play first track — pass the track directly to avoid ref timing issues
    if (isFirstTrack) {
      setTimeout(async () => {
        try {
          await player.loadTrack(0, newTrack);
          await player.play();
          if (isHost) emitPlay(roomCode, 0, 0);
        } catch (e) { console.log('Auto-play failed:', e); }
      }, 100);
    }

    try {
      await api.addToQueue(roomCode, {
        youtubeId: track.youtubeId, title: track.title,
        artist: track.artist, duration: track.duration,
        addedBy: userId || 'demo-user',
      });
    } catch { /* already added locally */ }
  }, [roomCode, queue, userId, isHost, player]);

  const currentTrack = queue[player.currentTrackIndex] || null;

  return (
    <View style={styles.container}>
      <PartyOverlay active={partyMode} />
      <View style={[styles.topBar, Platform.OS === 'web' && { paddingTop: 16 }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.roomName} numberOfLines={1}>{roomName}</Text>
        </View>
        <View style={styles.topBarRight}>
          <Text style={styles.participantCount}>{participants.length || 1} listening</Text>
          <TouchableOpacity style={styles.inviteBtn} onPress={() => setInviteVisible(true)}>
            <Text style={styles.inviteBtnText}>Invite</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <MusicPlayer
          trackTitle={currentTrack?.title || 'No track selected'}
          trackArtist={currentTrack?.artist || 'Search and add songs below'}
          isPlaying={player.isPlaying}
          positionMs={player.positionMs}
          durationMs={currentTrack ? currentTrack.duration * 1000 : 0}
          onPlay={handlePlay} onPause={handlePause} onSkip={handleSkip}
          onPrev={() => {}}
          onSeek={(ms) => { player.seek(ms); if (isHost) emitSeek(roomCode, ms); }}
        />
        <SearchMusic onAddTrack={handleAddTrack} />
        {queue.length > 0 && (
          <View style={styles.queueSection}>
            <Text style={styles.queueTitle}>QUEUE ({queue.length})</Text>
            {queue.map((track, i) => (
              <View key={track.id} style={styles.queueItem}>
                <View style={[styles.queueDot, i === player.currentTrackIndex && { backgroundColor: colors.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.queueTrack, i === player.currentTrackIndex && { color: colors.accent }]} numberOfLines={1}>{track.title}</Text>
                  <Text style={styles.queueArtist} numberOfLines={1}>{track.artist}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={styles.participantsSection}>
          <ParticipantsList participants={participants} hostId={hostId} />
        </View>
        <View style={styles.partyToggle}>
          <Text style={styles.partyLabel}>🎉 Party Mode</Text>
          <Switch value={partyMode} onValueChange={setPartyMode}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accent }} thumbColor="#fff" />
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
      <InviteModal visible={inviteVisible} roomCode={roomCode} onClose={() => setInviteVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  backBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 16 },
  roomName: { fontSize: 15, ...fonts.bold, color: colors.text, flex: 1 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  participantCount: { fontSize: 12, color: colors.textDim },
  inviteBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderAccent, backgroundColor: 'rgba(59,130,246,0.06)' },
  inviteBtnText: { color: colors.accent, fontSize: 12, ...fonts.semibold },
  content: { flex: 1, padding: spacing.md },
  participantsSection: { marginTop: spacing.md },
  partyToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, marginTop: spacing.md, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  partyLabel: { fontSize: 14, ...fonts.semibold, color: colors.text },
  queueSection: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  queueTitle: { fontSize: 11, ...fonts.semibold, color: colors.textDim, letterSpacing: 1.5, marginBottom: 12 },
  queueItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  queueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
  queueTrack: { fontSize: 13, ...fonts.medium, color: colors.text },
  queueArtist: { fontSize: 11, color: colors.textDim, marginTop: 2 },
});
