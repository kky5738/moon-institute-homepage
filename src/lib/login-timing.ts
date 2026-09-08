import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

type LoginStage =
  | "throttle"
  | "throttle.cleanup"
  | "throttle.account"
  | "throttle.ip"
  | "supabase"
  | "member.lookup"
  | "member.verify"
  | "throttle.clear";

const timings = new AsyncLocalStorage<Partial<Record<LoginStage, number>>>();

// Opt-in, request-local timings only. Never pass credentials/results to logs.
export async function withLoginTiming<T>(run: () => Promise<T>): Promise<T> {
  if (process.env.LOGIN_TIMING !== "1") return run();

  const started = performance.now();
  const stages: Partial<Record<LoginStage, number>> = {};
  try {
    return await timings.run(stages, run);
  } finally {
    console.info("[login-timing]", {
      requestId: randomUUID(),
      stages,
      totalMs: Math.round(performance.now() - started),
    });
  }
}

export async function measureLoginStage<T>(
  stage: LoginStage,
  run: () => Promise<T>,
): Promise<T> {
  const stages = timings.getStore();
  if (!stages) return run();
  const started = performance.now();
  try {
    return await run();
  } finally {
    stages[stage] = (stages[stage] ?? 0) + Math.round(performance.now() - started);
  }
}
