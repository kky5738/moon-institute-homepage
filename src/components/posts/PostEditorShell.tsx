import Link from "next/link";
import styles from "./post-editor.module.css";

export function PostEditorShell({ title, backHref, backLabel, children }: {
  title: string;
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.surface}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href={backHref}>← {backLabel}</Link>
          <h1>{title}</h1>
        </header>
        {children}
      </div>
    </div>
  );
}
