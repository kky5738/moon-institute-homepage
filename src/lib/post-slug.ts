export function createPostSlug(title: string, suffix: string) {
  const base =
    title
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "") || "post";

  return `${base}-${suffix.toLowerCase()}`;
}
