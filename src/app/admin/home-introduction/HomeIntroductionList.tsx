"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { homeIntroduction } from "@/lib/site-content";
import { acquireLock } from "@/lib/interaction-lock";
import { applyHomeIntroduction, refreshHomeIntroductionCache, type HomeIntroductionApplyResult } from "./actions";

type Content = {
  id: string; localAsset: string | null; message: string; altText: string;
  imageWidth: number; imageHeight: number; createdAt: string; lastAppliedAt: string | null;
  createdAtLabel: string; lastAppliedAtLabel: string | null;
};

export function HomeIntroductionList({ contents, currentContentId }: { contents: Content[]; currentContentId: string }) {
  const router = useRouter();
  const lock = useRef(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [result, setResult] = useState<HomeIntroductionApplyResult | null>(null);

  async function run(id?: string) {
    if (!acquireLock(lock)) return;
    setPendingId(id ?? "cache");
    setResult(null);
    try {
      const next = await (id ? applyHomeIntroduction(id) : refreshHomeIntroductionCache());
      setResult(next);
      if (next.status === "cache-error") router.refresh();
    } catch {
      setResult({ status: "cache-error", message: "처리 결과를 확인하지 못했습니다. 화면 정보를 갱신해 현재 적용 상태를 확인해주세요." });
    } finally {
      lock.current = false;
      setPendingId(null);
    }
  }

  return (
    <>
      <p className="mt-2 text-sm leading-6 text-muted">이전 이미지와 문구는 보관되며 언제든 다시 적용할 수 있습니다.</p>
      {result ? <div className="mt-4 border border-border p-4 text-sm leading-6">
        <p role={result.status === "success" ? "status" : "alert"}>{result.message}</p>
        {result.status === "cache-error" ? <button type="button" disabled={pendingId !== null} onClick={() => void run()}
          className="mt-3 border border-border px-4 py-2 font-semibold text-primary-dark disabled:opacity-50">화면 캐시 갱신 다시 시도</button> : null}
      </div> : null}
      <ul className="mt-5 divide-y divide-border border-y border-border" aria-busy={pendingId !== null}>
        {contents.map((content) => {
          const current = content.id === currentContentId;
          return <li key={content.id} className="grid gap-4 py-6 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <Image src={content.localAsset ? homeIntroduction.image : `/admin/home-introduction/${content.id}/image`}
              alt={content.altText} width={128} height={96} unoptimized
              className="h-24 w-32 border border-border bg-black object-contain" />
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className={`border px-2 py-1 ${current ? "border-primary text-primary" : "border-border text-muted"}`}>
                  {current ? "현재 적용 중" : content.lastAppliedAt ? "이전 적용본" : "등록 · 미적용"}
                </span>
                {content.localAsset ? <span className="border border-border px-2 py-1 text-muted">기본 콘텐츠</span> : null}
              </div>
              <p className="whitespace-pre-wrap font-semibold [overflow-wrap:anywhere]">{content.message}</p>
              <p className="mt-2 text-sm text-muted [overflow-wrap:anywhere]">이미지 설명: {content.altText}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{content.imageWidth} × {content.imageHeight}px · 등록 <time dateTime={content.createdAt}>{content.createdAtLabel}</time></p>
              <p className="mt-1 text-xs leading-5 text-muted">최종 적용: {content.lastAppliedAt ? <time dateTime={content.lastAppliedAt}>{content.lastAppliedAtLabel}</time> : "아직 적용하지 않음"}</p>
              {!current ? <button type="button" disabled={pendingId !== null} onClick={() => void run(content.id)}
                aria-label={`${content.message} — 현재 화면에 적용`}
                className="mt-4 border border-primary px-4 py-2 text-sm font-semibold text-primary-dark hover:bg-surface-alt disabled:opacity-50">
                {pendingId === content.id ? "적용 중…" : "현재 화면에 적용"}
              </button> : null}
            </div>
          </li>;
        })}
      </ul>
      {!contents.length ? <p className="py-6 text-sm text-muted">등록된 콘텐츠가 없습니다.</p> : null}
    </>
  );
}
