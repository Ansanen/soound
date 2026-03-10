import React, { useState, useEffect, createContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { colors } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';
import JoinRoomScreen from './src/screens/JoinRoomScreen';
import RoomScreen from './src/screens/RoomScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import { api } from './src/services/api';

export type RootStackParamList = {
  Main: undefined;
  JoinRoom: undefined;
  Room: { roomCode: string; roomName: string; isHost: boolean };
};

export const UserContext = createContext<{ userId: string; username: string }>({
  userId: '', username: '',
});

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const darkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 60 : 80,
          paddingBottom: Platform.OS === 'web' ? 8 : 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⭐</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function WebContainer({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={webStyles.outer}>
      <View style={[webStyles.inner, width > 500 && { maxWidth: 430, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.04)' }]}>
        {children}
      </View>
    </View>
  );
}

const webStyles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#000', alignItems: 'center' },
  inner: { flex: 1, width: '100%', backgroundColor: colors.bg },
});

export default function App() {
  const [user, setUser] = useState({ userId: '', username: '' });

  useEffect(() => {
    (async () => {
      const uname = 'User_' + Math.random().toString(36).slice(2, 6);
      try {
        const u = await api.createUser(uname) as any;
        setUser({ userId: u.id, username: u.username });
      } catch {
        setUser({ userId: 'local_' + Date.now(), username: uname });
      }
    })();
  }, []);

  return (
    <UserContext.Provider value={user}>
      <WebContainer>
        <NavigationContainer theme={darkTheme}>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="JoinRoom" component={JoinRoomScreen} />
            <Stack.Screen name="Room" component={RoomScreen} options={{ gestureEnabled: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </WebContainer>
    </UserContext.Provider>
  );
}
