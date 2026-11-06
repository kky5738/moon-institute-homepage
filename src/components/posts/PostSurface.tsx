import styles from "./post-surface.module.css";

export function PostSurface({ children }: { children: React.ReactNode }) {
  return <div className={styles.surface}>{children}</div>;
}
