import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { validateHomeIntroductionId } from "../src/lib/home-introduction-validation";

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply" && !arg.startsWith("--id="))) throw new Error("지원하지 않는 인자입니다.");
  const apply = args.includes("--apply");
  const idArg = args.find((arg) => arg.startsWith("--id="));
  const id = idArg ? validateHomeIntroductionId(idArg.slice(5)) : undefined;
  if (apply) {
    const operating = parse(readFileSync(".env"));
    const identity = (value: string | undefined) => { if (!value) throw new Error("대상 연결을 명시해주세요."); const url = new URL(value); return `${url.hostname}/${url.username}/${url.pathname}`; };
    if (!process.env.SUPABASE_URL || new URL(process.env.SUPABASE_URL).origin === new URL(operating.SUPABASE_URL).origin
      || identity(process.env.DATABASE_URL) === identity(operating.DATABASE_URL)) {
      throw new Error("이 도구의 실행은 운영과 분리된 DB·Storage에서만 허용합니다.");
    }
  }
  const { prisma } = await import("../src/lib/prisma");
  try {
    const contents = await prisma.homeIntroductionContent.findMany({
      where: { ...(id ? { id } : {}), objectPath: { not: null }, displayObjectPath: null }, select: { id: true }, orderBy: { id: "asc" },
    });
    console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", pending: contents.length }));
    if (apply) {
      const { backfillHomeIntroductionDisplay } = await import("../src/lib/home-introduction-backfill");
      for (const content of contents) console.log(JSON.stringify(await backfillHomeIntroductionDisplay(content.id)));
    }
  } finally { await prisma.$disconnect(); }
}

main().catch(() => { console.error("변환을 완료하지 못했습니다. 대상 연결·migration·원본 상태를 확인한 뒤 재실행해주세요."); process.exitCode = 1; });
