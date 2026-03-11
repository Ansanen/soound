import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Platform, Animated,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { User, Track, RoomState, SyncUpdatePayload } from '../types';
import { colors, spacing, radius, fonts, shadow } from '../theme';
import { useSocket } from '../hooks/useSocket';
import { useSyncPlayer } from '../hooks/useSyncPlayer';
import { api } from '../services/api';
import MusicPlayer from '../components/MusicPlayer';
import SearchMusic from '../components/SearchMusic';
import ParticipantsList from '../components/ParticipantsList';
import InviteModal from '../components/InviteModal';
import PartyOverlay from '../components/PartyOverlay';
import { RootStackParamList, UserContext } from '../contexts/UserContext';

type RoomRouteProp = RouteProp<RootStackParamList, 'Room'>;

// Animated now-playing indicator
function NowPlayingBars() {
  const bars = Array.from({ length: 3 }, () => React.useRef(new Animated.Value(0.3)).current);
  useEffect(() => {
    const anims = bars.map((bar, i) =>
      Animated.loop(Animated.sequence([
        Animated.timing(bar, { toValue: 1, duration: 300 + i * 100, useNativeDriver: true }),
        Animated.timing(bar, { toValue: 0.3, duration: 300 + i * 100, useNativeDriver: true }),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center', height: 14 }}>
      {bars.map((bar, i) => (
        <Animated.View key={i} style={{
          width: 3, height: 12, borderRadius: 1.5,
          backgroundColor: colors.accent,
          transform: [{ scaleY: bar }],
        }} />
      ))}
    </View>
  );
}

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
    onSyncUpdate: (payload: SyncUpdatePayload) => { player.handleSyncUpdate(payload); },
    onUserJoined: ({ user }) => { setParticipants(prev => [...prev.filter(p => p.id !== user.id), user]); },
    onUserLeft: ({ userId: uid }) => { setParticipants(prev => prev.filter(p => p.id !== uid)); },
    onQueueUpdated: ({ queue: q }) => { setQueue(q); },
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
      id: Date.now().toString(), youtubeId: track.youtubeId,
      title: track.title, artist: track.artist, duration: track.duration,
      addedBy: userId || 'demo-user', position: queue.length,
    };
    const isFirstTrack = queue.length === 0;
    setQueue(prev => [...prev, newTrack]);

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
    } catch {}
  }, [roomCode, queue, userId, isHost, player]);

  const currentTrack = queue[player.currentTrackIndex] || null;
  const listenerCount = Math.max(participants.length, 1);

  return (
    <View style={styles.container}>
      <PartyOverlay active={partyMode} />

      {/* Header */}
      <View style={[styles.header, Platform.OS === 'web' && { paddingTop: 16 }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <View style={styles.backChevron}>
            <View style={styles.chevron1} />
            <View style={styles.chevron2} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.roomName} numberOfLines={1}>{roomName}</Text>
          <View style={styles.liveRow}>
            <View style={styles.livePulse} />
            <Text style={styles.liveText}>{listenerCount} listening</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.inviteBtn} onPress={() => setInviteVisible(true)} activeOpacity={0.7}>
          <Text style={styles.invitePlus}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Room code chip */}
        <View style={styles.codeChip}>
          <View style={styles.codeIconDot} />
          <Text style={styles.codeText}>{roomCode}</Text>
        </View>

        {/* Player */}
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

        {/* Search */}
        <SearchMusic onAddTrack={handleAddTrack} />

        {/* Queue */}
        {queue.length > 0 && (
          <View style={styles.queueCard}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueLabel}>UP NEXT</Text>
              <View style={styles.queueCountBadge}>
                <Text style={styles.queueCountText}>{queue.length}</Text>
              </View>
            </View>
            {queue.map((track, i) => {
              const isCurrent = i === player.currentTrackIndex;
              return (
                <View key={track.id} style={[styles.queueItem, isCurrent && styles.queueItemCurrent]}>
                  <View style={styles.queueLeft}>
                    {isCurrent ? (
                      <NowPlayingBars />
                    ) : (
                      <Text style={styles.queueNum}>{i + 1}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.queueTitle, isCurrent && { color: colors.accent }]} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.queueArtist} numberOfLines={1}>{track.artist}</Text>
                  </View>
                  <Text style={styles.queueDur}>
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Participants */}
        <View style={{ marginTop: spacing.lg }}>
          <ParticipantsList participants={participants} hostId={hostId} />
        </View>

        {/* Party mode */}
        <View style={styles.partyCard}>
          <View style={styles.partyInfo}>
            <View style={styles.partyIconWrap}>
              <View style={styles.partySparkle1} />
              <View style={styles.partySparkle2} />
              <View style={styles.partySparkle3} />
            </View>
            <View>
              <Text style={styles.partyTitle}>Party Mode</Text>
              <Text style={styles.partySub}>Visual effects while listening</Text>
            </View>
          </View>
          <Switch
            value={partyMode} onValueChange={setPartyMode}
            trackColor={{ false: 'rgba(255,255,255,0.06)', true: colors.accent }}
            thumbColor="#fff"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <InviteModal visible={inviteVisible} roomCode={roomCode} onClose={() => setInviteVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 13,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  backChevron: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  chevron1: {
    width: 8, height: 1.5, backgroundColor: colors.textSub,
    borderRadius: 1, transform: [{ rotate: '-45deg' }, { translateY: -2 }],
  },
  chevron2: {
    width: 8, height: 1.5, backgroundColor: colors.textSub,
    borderRadius: 1, transform: [{ rotate: '45deg' }, { translateY: 2 }],
  },
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 12 },
  roomName: { fontSize: 15, ...fonts.bold, color: colors.text },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  livePulse: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.neonGreen,
    ...shadow(colors.neonGreen, 0, 0, 0.8, 4),
  },
  liveText: { fontSize: 11, color: colors.textDim, ...fonts.medium },
  inviteBtn: {
    width: 38, height: 38, borderRadius: 13,
    backgroundColor: colors.accentMuted, borderWidth: 1, borderColor: colors.borderAccent,
    alignItems: 'center', justifyContent: 'center',
  },
  invitePlus: { color: colors.accent, fontSize: 20, ...fonts.bold, marginTop: -1 },

  scroll: { flex: 1, padding: spacing.md },

  // Code chip
  codeChip: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 5, paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder,
    marginBottom: spacing.md,
  },
  codeIconDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent,
  },
  codeText: {
    fontSize: 12, color: colors.accentLight, ...fonts.bold, letterSpacing: 3,
  },

  // Queue
  queueCard: {
    marginTop: spacing.lg, padding: spacing.md,
    borderRadius: 20, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  queueHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  queueLabel: {
    fontSize: 11, ...fonts.bold, color: colors.textDim, letterSpacing: 2,
  },
  queueCountBadge: {
    backgroundColor: colors.accent, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  queueCountText: { color: '#fff', fontSize: 10, ...fonts.bold },
  queueItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, gap: 12,
  },
  queueItemCurrent: {
    marginHorizontal: -spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(124,58,237,0.04)', borderRadius: 10,
  },
  queueLeft: { width: 24, alignItems: 'center' },
  queueNum: { fontSize: 12, color: colors.textMuted, ...fonts.semibold },
  queueTitle: { fontSize: 13, ...fonts.medium, color: colors.text },
  queueArtist: { fontSize: 11, color: colors.textDim, marginTop: 2 },
  queueDur: { fontSize: 11, color: colors.textMuted, ...fonts.medium },

  // Party
  partyCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, marginTop: spacing.md,
    borderRadius: 20, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  partyInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  partyIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(236,72,153,0.1)', borderWidth: 1, borderColor: 'rgba(236,72,153,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  partySparkle1: {
    width: 4, height: 4, borderRadius: 2, backgroundColor: colors.neonPink,
    position: 'absolute',
  },
  partySparkle2: {
    width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.neonPink,
    position: 'absolute', top: 8, right: 8, opacity: 0.6,
  },
  partySparkle3: {
    width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.neonPink,
    position: 'absolute', bottom: 8, left: 10, opacity: 0.4,
  },
  partyTitle: { fontSize: 14, ...fonts.semibold, color: colors.text },
  partySub: { fontSize: 11, color: colors.textDim, marginTop: 1 },
});
