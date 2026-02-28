import type { RoomState } from "./RoomManager.js";

export function nextEligibleTurn(room: RoomState): number | null {
  const n = room.players.length;
  for (let step = 1; step <= n; step += 1) {
    const idx = (room.turnIndex + step) % n;
    const player = room.players[idx];
    if (player.connected && !room.failedPlayerIds.has(player.userId)) {
      return idx;
    }
  }
  return null;
}
