"use client";

import { useMemo, useState } from "react";
import { getSocket } from "../lib/socket";
import { useGameStore } from "../lib/store";

export function GameScreen() {
  const roomState = useGameStore((s) => s.roomState);
  const username = useGameStore((s) => s.username);
  const [answer, setAnswer] = useState("");

  const myTurn = useMemo(() => {
    if (!roomState) return false;
    const me = roomState.players.find((player) => player.username === username);
    return !!me && roomState.activePlayerId === me.userId;
  }, [roomState, username]);

  if (!roomState) {
    return <div className="text-2xl">대기 중...</div>;
  }

  const submit = () => {
    if (!roomState.challengeId || !answer) return;
    getSocket().emit("answer:submit", {
      roomId: roomState.roomId,
      challengeId: roomState.challengeId,
      answer,
      clientSeq: Date.now()
    });
    setAnswer("");
  };

  const renderOptions = () => {
    const question = roomState.currentQuestion;
    if (!question) return null;
    const options = "options" in question && Array.isArray(question.options) ? question.options : null;
    if (!options || options.length === 0) return null;

    return (
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => setAnswer(option)}
            className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xl font-semibold"
          >
            {option}
          </button>
        ))}
      </div>
    );
  };

  const healthSlots = Array.from({ length: roomState.maxTeamHealth }, (_, i) => i < roomState.teamHealth);

  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-3xl font-bold">협동 한글 퀘스트</h2>
        <div className="rounded-full bg-slate-100 px-4 py-1 text-sm font-semibold">
          방 코드: {roomState.roomCode}
        </div>
      </div>
      <p className="mt-1 text-sm">모드: {roomState.mode}</p>
      <p className="mt-2 text-xl">{roomState.chapterTitle}</p>
      <p className="mt-1 text-lg">퀘스트: {roomState.questTitle}</p>
      <p className="mt-1 text-base">학습 목표: {roomState.learningGoal}</p>
      <p className="mt-1 text-base">스토리 목표: {roomState.storyGoal}</p>
      <p className="mt-2 text-xl">레벨 {roomState.level}</p>
      <p className="mt-2 text-lg">현재 상태: {roomState.status}</p>
      {roomState.status === "LOBBY" && (
        <p className="mt-2 text-base text-slate-600">친구에게 방 코드를 공유하세요.</p>
      )}
      <p className="mt-1 text-sm">
        퀘스트 진행 {roomState.successfulMiniGames}/{roomState.requiredSuccesses} · 평균 응답 {roomState.averageResponseMs}ms · 연속 실패 {roomState.consecutiveFailures}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-rose-50 p-3">
          <p className="text-sm font-semibold">팀 체력</p>
          <div className="mt-2 flex gap-2">
            {healthSlots.map((filled, idx) => (
              <span key={idx} className={`inline-block h-4 w-6 rounded ${filled ? "bg-rose-500" : "bg-rose-200"}`} />
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-sm font-semibold">진행도 {roomState.progressMeter}%</p>
          <div className="mt-2 h-3 rounded bg-emerald-200">
            <div className="h-3 rounded bg-emerald-500" style={{ width: `${roomState.progressMeter}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-violet-50 p-3 text-sm">
        <p>
          설정: 실패 없음 {roomState.settings.noFailureCondition ? "ON" : "OFF"} / 난이도 {roomState.settings.difficultyOverride ?? "AUTO"}
        </p>
      </div>

      <div className="mt-6 rounded-xl bg-sky-50 p-4">
        <p className="text-lg">문제</p>
        <p className="text-sm">미니게임: {roomState.currentQuestion?.miniGameType ?? "준비 중"}</p>
        <p className="mt-2 text-hangul font-extrabold">{roomState.currentQuestion?.prompt ?? "문제 준비 중"}</p>
        {renderOptions()}
      </div>

      <div className="mt-6 flex gap-3">
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="정답을 입력하세요"
          className="flex-1 rounded-xl border border-sky-300 p-3 text-2xl"
        />
        <button
          onClick={submit}
          disabled={!myTurn}
          className="rounded-xl bg-blue-500 px-6 py-3 text-xl font-bold text-white disabled:bg-gray-300"
        >
          제출
        </button>
      </div>

      {roomState.mode === "CLASSROOM" && (
        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold">Classroom Performance</p>
          <div className="mt-2 space-y-1 text-sm">
            {roomState.playerPerformance.map((row) => (
              <p key={row.userId}>
                {row.username}: 시도 {row.attempts} / 정답 {row.correct} / 시간초과 {row.timeouts}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
