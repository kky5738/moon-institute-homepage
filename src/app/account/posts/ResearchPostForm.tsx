import Link from "next/link";

type ResearchPostFormProps = {
  action: (formData: FormData) => Promise<void>;
  post?: {
    id: number;
    title: string;
    summary: string | null;
    content: string;
  };
};

export function ResearchPostForm({ action, post }: ResearchPostFormProps) {
  return (
    <form action={action} className="mt-8 space-y-6">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-foreground">
          제목
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={post?.title}
          className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-semibold text-foreground">
          요약
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={3}
          maxLength={500}
          defaultValue={post?.summary ?? ""}
          className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-semibold text-foreground">
          본문
        </label>
        <textarea
          id="content"
          name="content"
          rows={16}
          required
          maxLength={100_000}
          defaultValue={post?.content}
          className="mt-2 w-full border border-border bg-surface px-3 py-2 text-sm leading-7 outline-none focus:border-primary"
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-6">
        <Link
          href="/account/posts"
          className="inline-flex h-11 items-center border border-border bg-surface px-5 text-sm font-semibold text-foreground hover:border-accent"
        >
          취소
        </Link>
        <button
          type="submit"
          name="intent"
          value="draft"
          formNoValidate
          className="inline-flex h-11 cursor-pointer items-center border border-border bg-surface px-5 text-sm font-semibold text-primary-dark hover:border-primary"
        >
          임시저장
        </button>
        <button
          type="submit"
          name="intent"
          value="publish"
          className="inline-flex h-11 cursor-pointer items-center border border-primary bg-primary-dark px-5 text-sm font-semibold text-white hover:bg-primary"
        >
          {post ? "저장 후 공개" : "공개하기"}
        </button>
      </div>
    </form>
  );
}
