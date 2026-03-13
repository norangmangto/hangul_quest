import { create } from 'zustand';
import type { RoomStateDTO } from '@hangul-quest/shared';

type GameStore = {
  myName: string;
  myId: string;
  roomState: RoomStateDTO | null;
  setMyName: (name: string) => void;
  setMyId: (id: string) => void;
  setRoomState: (state: RoomStateDTO) => void;
  reset: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  myName: '',
  myId: '',
  roomState: null,
  setMyName: (myName) => set({ myName }),
  setMyId: (myId) => set({ myId }),
  setRoomState: (roomState) => set({ roomState }),
  reset: () => set({ myName: '', myId: '', roomState: null }),
}));
