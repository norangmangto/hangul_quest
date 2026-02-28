import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type PackageJson = {
  dependencies?: Record<string, string>;
};

function major(versionRange: string | undefined): number | null {
  if (!versionRange) return null;
  const normalized = versionRange.replace(/^[^0-9]*/, "");
  const value = Number.parseInt(normalized.split(".")[0], 10);
  return Number.isFinite(value) ? value : null;
}

describe("dependency compatibility", () => {
  it("keeps fastify and @fastify/sensible majors compatible", () => {
    const packagePath = resolve(process.cwd(), "package.json");
    const pkg = JSON.parse(readFileSync(packagePath, "utf8")) as PackageJson;

    const fastifyMajor = major(pkg.dependencies?.fastify);
    const sensibleMajor = major(pkg.dependencies?.["@fastify/sensible"]);

    expect(fastifyMajor).not.toBeNull();
    expect(sensibleMajor).not.toBeNull();

    if ((fastifyMajor ?? 0) >= 5) {
      expect((sensibleMajor ?? 0) >= 6).toBe(true);
    }
  });
});
