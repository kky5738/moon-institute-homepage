import Link from "next/link";
import { AttachmentKind } from "@/generated/prisma/enums";
import type { BoardPostDetail } from "@/lib/posts";
import { formatResearchFileSize } from "@/lib/research-files";
import { PostSurface } from "./PostSurface";
import styles from "./post-surface.module.css";

export function PostDocument({ post, backHref, backLabel, tools, children, supplement }: {
  post: BoardPostDetail;
  backHref: string;
  backLabel: string;
  tools?: React.ReactNode;
  children: React.ReactNode;
  supplement?: React.ReactNode;
}) {
  const files = post.attachments.filter((file) => file.kind === AttachmentKind.ATTACHMENT);
  return (
    <PostSurface>
      <article className={styles.document}>
        <div className={styles.topbar}>
          <Link href={backHref}>← {backLabel}</Link>
          {tools}
        </div>
        <div className={styles.paper}>
          <header className={styles.heading}>
            <p className="text-xs text-muted">{post.category}</p>
            <h1>{post.title}</h1>
            <div className={styles.meta}>
              {post.authorName && <span>작성자 {post.authorName}</span>}
              <span>작성일 <time>{post.publishedAt}</time></span>
            </div>
          </header>
          <div className={styles.body}>{children}</div>
          {files.length > 0 && (
            <section className={styles.attachments} aria-labelledby="attachments-title">
              <h2 id="attachments-title">첨부파일</h2>
              <ul>
                {files.map((file) => (
                  <li key={file.id}>
                    {file.url ? (
                      <a href={file.url} className={styles.file}>
                        <span className={styles.filename}>{file.originalName}</span>
                        <span className={styles.format}>{file.originalName.split(".").pop()?.toUpperCase()} · {formatResearchFileSize(file.size)}</span>
                        <span className={styles.download}>다운로드</span>
                      </a>
                    ) : (
                      <div className={styles.file}>
                        <span className={styles.filename}>{file.originalName}</span>
                        <span className={styles.format}>{file.originalName.split(".").pop()?.toUpperCase()} · {formatResearchFileSize(file.size)}</span>
                        <span className="text-xs text-muted">다운로드할 수 없습니다.</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {supplement}
          <nav aria-label="게시글 탐색" className={styles.footer}>
            <Link href={backHref} className="text-sm font-semibold text-primary hover:underline">{backLabel} 목록</Link>
          </nav>
        </div>
      </article>
    </PostSurface>
  );
}
