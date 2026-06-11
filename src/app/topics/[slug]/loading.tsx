export default function TopicDetailLoading() {
  return (
    <div className="bg-background">
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="h-4 w-28 rounded-full bg-secondary" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
            <div>
              <div className="h-4 w-32 rounded-full bg-secondary" />
              <div className="mt-6 h-14 max-w-3xl rounded-lg bg-secondary" />
              <div className="mt-5 h-24 max-w-2xl rounded-lg bg-secondary" />
            </div>
            <div className="h-52 border border-border bg-secondary/55" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-12 lg:grid-cols-2 lg:px-8">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-72 border border-border bg-surface shadow-sm shadow-primary-dark/5"
          >
            <div className="border-b border-border p-5">
              <div className="h-6 w-32 rounded-lg bg-secondary" />
              <div className="mt-4 h-12 rounded-lg bg-secondary" />
            </div>
            <div className="p-5">
              <div className="h-24 rounded-lg bg-secondary" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
