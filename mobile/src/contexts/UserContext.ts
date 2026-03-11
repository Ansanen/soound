import { createContext } from 'react';

export type RootStackParamList = {
  Main: undefined;
  JoinRoom: undefined;
  Room: { roomCode: string; roomName: string; isHost: boolean };
};

export const UserContext = createContext<{ userId: string; username: string }>({
  userId: '',
  username: '',
});
