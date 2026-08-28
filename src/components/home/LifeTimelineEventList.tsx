import { formatLifeEventDate, type LifeEvent } from "@/lib/life-events";

export function LifeTimelineEventList({ events }: { events: LifeEvent[] }) {
  return (
    <details className="mt-4 rounded-lg border border-border bg-white/65 px-4 py-3 text-sm sm:px-5">
      <summary className="cursor-pointer font-semibold text-primary-dark">
        연대순 전체 목록 보기 ({events.length}건)
      </summary>
      <ol className="mt-4 max-h-80 space-y-3 overflow-y-auto border-t border-border pt-4">
        {events.map((event, index) => (
          <li
            key={`${event.date}-${index}`}
            className="grid gap-1 sm:grid-cols-[7rem_1fr]"
          >
            <time className="font-semibold text-accent-purple">
              {formatLifeEventDate(event.date)}
            </time>
            <span className="leading-6 text-foreground">{event.title}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
