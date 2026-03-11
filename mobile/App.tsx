import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { colors, fonts } from './src/theme';
import { RootStackParamList, UserContext } from './src/contexts/UserContext';
import HomeScreen from './src/screens/HomeScreen';
import JoinRoomScreen from './src/screens/JoinRoomScreen';
import RoomScreen from './src/screens/RoomScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import { api } from './src/services/api';

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

function TabBarIcon({ focused, label }: { focused: boolean; label: string }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={[tabStyles.icon, { color: focused ? colors.accent : colors.textMuted }]}>
        {label}
      </Text>
      {focused && <View style={tabStyles.activeDot} />}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center', justifyContent: 'center',
    width: 44, height: 32, borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: colors.accentMuted,
  },
  icon: { fontSize: 18, ...fonts.bold },
  activeDot: {
    position: 'absolute', bottom: -6,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.accent,
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'web' ? 56 : 84,
          paddingBottom: Platform.OS === 'web' ? 8 : 24,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10, ...fonts.semibold, marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="~" />,
          tabBarLabel: 'Listen',
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} label="*" />,
          tabBarLabel: 'Rewards',
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
      <View style={[webStyles.inner, width > 500 && webStyles.innerWide]}>
        {children}
      </View>
    </View>
  );
}

const webStyles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#000', alignItems: 'center' },
  inner: { flex: 1, width: '100%', backgroundColor: colors.bg },
  innerWide: {
    maxWidth: 430,
    borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
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
