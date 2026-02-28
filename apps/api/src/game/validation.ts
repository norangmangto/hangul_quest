export function normalizeHangul(input: string): string {
  return input.trim().replace(/\s+/g, "");
}

export function validateAnswer(expected: string, submitted: string, mode: "EXACT" | "RPS_COUNTER" = "EXACT"): boolean {
  const e = normalizeHangul(expected);
  const s = normalizeHangul(submitted);

  if (mode === "EXACT") return e === s;

  const rpsCounter: Record<string, string> = {
    가위: "바위",
    바위: "보",
    보: "가위"
  };

  return rpsCounter[e] === s;
}
