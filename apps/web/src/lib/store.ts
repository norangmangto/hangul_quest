import { create } from "zustand";
import type { RoomStateDTO } from "@hangul-quest/shared";

type GameStore = {
  username: string;
  roomCode: string;
  roomState: RoomStateDTO | null;
  setUsername: (username: string) => void;
  setRoomCode: (roomCode: string) => void;
  setRoomState: (state: RoomStateDTO) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  username: "",
  roomCode: "",
  roomState: null,
  setUsername: (username) => set({ username }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setRoomState: (roomState) => set({ roomState })
}));
