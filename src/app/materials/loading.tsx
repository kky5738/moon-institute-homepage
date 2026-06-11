export default function MaterialsLoading() {
  return (
    <div className="bg-background">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-end lg:px-10 lg:py-20">
          <div>
            <div className="h-4 w-24 rounded-full bg-secondary" />
            <div className="mt-5 h-12 max-w-2xl rounded-lg bg-secondary" />
            <div className="mt-5 h-20 max-w-3xl rounded-lg bg-secondary" />
          </div>
          <div className="h-40 rounded-lg border border-border bg-secondary/55" />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-12 sm:px-6 md:grid-cols-2 lg:px-10 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-80 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)]"
          >
            <div className="h-6 w-32 rounded-full bg-secondary" />
            <div className="mt-8 h-8 rounded-lg bg-secondary" />
            <div className="mt-4 h-20 rounded-lg bg-secondary" />
            <div className="mt-8 h-24 rounded-lg bg-secondary" />
          </div>
        ))}
      </section>
    </div>
  );
}
