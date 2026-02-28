"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Difficulty } from "@hangul-quest/shared";
import { GameScreen } from "../../../components/GameScreen";
import { getSocket, syncSocketAuthToken } from "../../../lib/socket";
import { useGameStore } from "../../../lib/store";

export default function GameRoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const username = useGameStore((s) => s.username);
  const roomState = useGameStore((s) => s.roomState);
  const setRoomState = useGameStore((s) => s.setRoomState);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3000);
  };

  const mapErrorMessage = (message: string) => {
    if (message === "not_enough_players") return "게임 시작을 위해 최소 2명이 필요합니다.";
    if (message === "not_a_room_member") return "방에 참가하지 않았습니다.";
    if (message === "room_not_found") return "방을 찾을 수 없습니다.";
    return message;
  };

  const redirectToHomeWithToast = (message: string) => {
    try {
      sessionStorage.setItem("hq.toast", message);
    } catch {
      // Ignore storage failures.
    }
    router.replace("/");
  };

  useEffect(() => {
    const socket = getSocket();
    const roomId = params.roomId;

    const tryResume = () => {
      if (!roomId) return;
      socket.emit("room:resume", { roomId }, (res) => {
        if (res.ok && res.roomState) {
          setRoomState(res.roomState);
          return;
        }
        if (res.message === "room_not_found") {
          redirectToHomeWithToast(mapErrorMessage(res.message));
          return;
        }
      });
    };

    const token = localStorage.getItem("token");
    if (token) {
      syncSocketAuthToken(token);
      if (!socket.connected) socket.connect();
    }

    const onRoomState = (payload: any) => {
      setRoomState(payload);
    };

    const onErrorEvent = (payload: any) => {
      const code = payload?.code || "unknown";
      const rawMessage = payload?.message || "";
      const message = mapErrorMessage(rawMessage) || "요청을 처리하지 못했습니다.";
      console.error("Socket error:event", { code, rawMessage, payload });
      if (rawMessage === "room_not_found") {
        redirectToHomeWithToast(message);
        return;
      }
      setError(message);
      showToast(message);
    };

    const onConnectError = () => {
      const message = "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
      console.error("Socket connect_error");
      setError(message);
      showToast(message);
    };

    const onConnect = () => {
      tryResume();
    };

    socket.on("room:state", onRoomState);
    socket.on("error:event", onErrorEvent);
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    if (socket.connected) {
      tryResume();
    }

    return () => {
      socket.off("room:state", onRoomState);
      socket.off("error:event", onErrorEvent);
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
    };
  }, [params.roomId, router, setRoomState]);

  const start = () => {
    setError(null);
    if (!roomState) {
      showToast("방 정보를 불러오는 중입니다.");
      return;
    }
    if (roomState.mode !== "CLASSROOM" && roomState.players.length < 2) {
      showToast("게임 시작을 위해 최소 2명이 필요합니다.");
      return;
    }
    getSocket().emit("room:start", { roomId: params.roomId });
  };

  const isHost = !!roomState && roomState.players.some((p) => p.username === username && p.userId === roomState.hostUserId);
  const canStart = !!roomState && (roomState.mode === "CLASSROOM" || roomState.players.length >= 2);

  const updateNoFail = (checked: boolean) => {
    getSocket().emit("room:settings:update", {
      roomId: params.roomId,
      noFailureCondition: checked
    });
  };

  const updateDifficulty = (value: "AUTO" | Difficulty) => {
    getSocket().emit("room:settings:update", {
      roomId: params.roomId,
      difficultyOverride: value === "AUTO" ? null : value
    });
  };

  return (
    <main className="min-h-screen p-6">
      {toast && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
      <div className="mx-auto mb-4 max-w-3xl space-y-3">
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button
          onClick={start}
          disabled={!isHost || !canStart}
          className="rounded-xl bg-violet-500 px-4 py-2 text-lg font-bold text-white disabled:bg-slate-300"
        >
          게임 시작
        </button>
        {!canStart && roomState?.mode !== "CLASSROOM" && (
          <p className="text-sm text-slate-600">게임 시작을 위해 최소 2명이 필요합니다.</p>
        )}

        {isHost && roomState?.mode === "CLASSROOM" && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
            <p className="text-sm font-semibold">Teacher Controls</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={roomState.settings.noFailureCondition}
                  onChange={(e) => updateNoFail(e.target.checked)}
                />
                실패 없음
              </label>
              <select
                value={roomState.settings.difficultyOverride ?? "AUTO"}
                onChange={(e) => updateDifficulty(e.target.value as "AUTO" | Difficulty)}
                className="rounded-lg border border-violet-200 bg-white px-2 py-1 text-sm"
              >
                <option value="AUTO">난이도 자동</option>
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
              </select>
            </div>
          </div>
        )}
      </div>
      <GameScreen />
    </main>
  );
}
