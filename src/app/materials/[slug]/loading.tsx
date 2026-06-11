export default function MaterialDetailLoading() {
  return (
    <article className="bg-background">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:px-10 lg:py-20">
          <div className="h-4 w-28 rounded-full bg-secondary" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]">
            <div>
              <div className="h-6 w-56 rounded-full bg-secondary" />
              <div className="mt-6 h-14 max-w-3xl rounded-lg bg-secondary" />
              <div className="mt-5 h-20 max-w-2xl rounded-lg bg-secondary" />
            </div>
            <div className="h-56 rounded-lg border border-border bg-secondary/55" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:px-10">
        <div className="grid gap-6">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-48 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
            >
              <div className="h-4 w-32 rounded-full bg-secondary" />
              <div className="mt-5 h-8 w-48 rounded-lg bg-secondary" />
              <div className="mt-5 h-20 rounded-lg bg-secondary" />
            </div>
          ))}
        </div>
        <aside className="h-80 rounded-lg border border-border bg-card shadow-[var(--shadow-soft)]" />
      </div>
    </article>
  );
}
