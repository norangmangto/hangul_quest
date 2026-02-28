"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Difficulty, GameMode } from "@hangul-quest/shared";
import { getSocket, syncSocketAuthToken } from "../lib/socket";
import { useGameStore } from "../lib/store";

export default function HomePage() {
  const router = useRouter();
  const setUsername = useGameStore((s) => s.setUsername);
  const setRoomCode = useGameStore((s) => s.setRoomCode);

  const [username, setName] = useState("");
  const [roomCode, setCode] = useState("");
  const [mode, setMode] = useState<GameMode>("STORY_CAMPAIGN");
  const [noFailureCondition, setNoFailureCondition] = useState(false);
  const [difficultyOverride, setDifficultyOverride] = useState<Difficulty | "AUTO">("AUTO");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"create" | "join" | null>(null);
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

  useEffect(() => {
    const pendingToast = sessionStorage.getItem("hq.toast");
    if (pendingToast) {
      sessionStorage.removeItem("hq.toast");
      showToast(pendingToast);
    }
  }, []);

  const attachSocketGuards = (socket: ReturnType<typeof getSocket>) => {
    const onErrorEvent = (payload: { code: string; message: string }) => {
      const message = payload.message || "요청을 처리하지 못했습니다.";
      console.error("Socket error:event", payload);
      setError(message);
      showToast(message);
      setSubmitting(null);
    };
    const onConnectError = () => {
      const message = "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
      console.error("Socket connect_error");
      setError(message);
      showToast(message);
      setSubmitting(null);
    };

    socket.once("error:event", onErrorEvent);
    socket.once("connect_error", onConnectError);

    return () => {
      socket.off("error:event", onErrorEvent);
      socket.off("connect_error", onConnectError);
    };
  };

  const createRoom = () => {
    if (!username.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    setError(null);
    setSubmitting("create");
    const socket = getSocket();
    socket.connect();
    const detachGuards = attachSocketGuards(socket);
    const fallbackTimeout = window.setTimeout(() => {
      setError("서버 응답이 없습니다. 잠시 후 다시 시도해주세요.");
      setSubmitting(null);
      detachGuards();
    }, 6000);
    socket.emit(
      "room:create",
      {
        username,
        mode,
        noFailureCondition: mode === "CLASSROOM" ? true : noFailureCondition,
        difficultyOverride: difficultyOverride === "AUTO" ? null : difficultyOverride
      },
      (res) => {
        window.clearTimeout(fallbackTimeout);
        detachGuards();
        setSubmitting(null);
        localStorage.setItem("token", res.token);
        syncSocketAuthToken(res.token);
        setUsername(username);
        setRoomCode(res.roomCode);
        router.push(`/game/${res.roomId}`);
      }
    );
  };

  const joinRoom = () => {
    if (!username.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!roomCode.trim()) {
      setError("방 코드를 입력해주세요.");
      return;
    }

    setError(null);
    setSubmitting("join");
    const socket = getSocket();
    socket.connect();
    const detachGuards = attachSocketGuards(socket);
    const fallbackTimeout = window.setTimeout(() => {
      setError("서버 응답이 없습니다. 잠시 후 다시 시도해주세요.");
      setSubmitting(null);
      detachGuards();
    }, 6000);
    socket.emit("room:join", { username, roomCode }, (res) => {
      window.clearTimeout(fallbackTimeout);
      detachGuards();
      setSubmitting(null);
      localStorage.setItem("token", res.token);
      syncSocketAuthToken(res.token);
      setUsername(username);
      setRoomCode(roomCode);
      router.push(`/game/${res.roomId}`);
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-6">
      <h1 className="text-5xl font-extrabold">한글 퀘스트</h1>
      <p className="text-xl">친구들과 함께 미션을 해결하며 한글을 배워요</p>
      {toast && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <input
        placeholder="이름"
        value={username}
        onChange={(e) => setName(e.target.value)}
        className="rounded-xl border border-sky-300 p-3 text-xl"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as GameMode)}
          className="rounded-xl border border-sky-300 p-3 text-base"
        >
          <option value="STORY_CAMPAIGN">Story Campaign</option>
          <option value="VILLAGE_FESTIVAL">Village Festival</option>
          <option value="CLASSROOM">Classroom Mode</option>
        </select>
        <select
          value={difficultyOverride}
          onChange={(e) => setDifficultyOverride(e.target.value as Difficulty | "AUTO")}
          className="rounded-xl border border-sky-300 p-3 text-base"
        >
          <option value="AUTO">난이도 자동</option>
          <option value="BEGINNER">BEGINNER</option>
          <option value="INTERMEDIATE">INTERMEDIATE</option>
          <option value="ADVANCED">ADVANCED</option>
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-sky-300 p-3 text-sm">
          <input
            type="checkbox"
            checked={mode === "CLASSROOM" ? true : noFailureCondition}
            onChange={(e) => setNoFailureCondition(e.target.checked)}
            disabled={mode === "CLASSROOM"}
          />
          실패 조건 없음
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={createRoom}
          disabled={submitting !== null}
          className="rounded-xl bg-blue-500 p-3 text-xl font-bold text-white disabled:bg-slate-300"
        >
          방 만들기
        </button>
        <input
          placeholder="방 코드"
          value={roomCode}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="rounded-xl border border-sky-300 p-3 text-xl"
        />
      </div>

      <button
        onClick={joinRoom}
        disabled={submitting !== null}
        className="rounded-xl bg-emerald-500 p-3 text-xl font-bold text-white disabled:bg-slate-300"
      >
        방 참가하기
      </button>
    </main>
  );
}
