import { AttachmentKind } from "@/generated/prisma/enums";
import Image from "next/image";
import { splitResearchContent } from "@/lib/research-files";
import type { BoardPostDetail } from "@/lib/posts";

export function ResearchPostContent({
  content,
  attachments,
}: Pick<BoardPostDetail, "content" | "attachments">) {
  const images = new Map(
    attachments
      .filter((file) => file.kind === AttachmentKind.INLINE_IMAGE)
      .map((file) => [file.id, file]),
  );

  return (
    <div className="space-y-8 text-[15px] leading-7 text-foreground sm:text-base sm:leading-8 lg:text-[17px] lg:leading-9">
      {splitResearchContent(content).map((part, index) => {
        if (part.type === "text") {
          return part.value ? (
            <p key={`text-${index}`} className="whitespace-pre-wrap break-words">
              {part.value}
            </p>
          ) : null;
        }

        const image = images.get(part.id);
        if (!image?.url || !image.imageWidth || !image.imageHeight) {
          return (
            <p key={part.id} className="border border-border bg-background p-4 text-sm text-muted">
              본문 이미지를 불러올 수 없습니다.
            </p>
          );
        }

        return (
          <figure key={part.id} className="space-y-2">
            <Image
              src={image.url}
              alt={image.altText ?? ""}
              width={image.imageWidth}
              height={image.imageHeight}
              sizes="(max-width: 640px) calc(100vw - 2.5rem), 78ch"
              loading="lazy"
              className="h-auto max-h-[75vh] w-auto max-w-full border border-border object-contain"
            />
            {image.altText ? (
              <figcaption className="text-sm leading-6 text-muted">
                {image.altText}
              </figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}
