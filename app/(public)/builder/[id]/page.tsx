export default function BuilderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="min-h-screen px-4 py-24 text-foreground">
      <h1 className="font-display text-2xl font-semibold">
        Builder {params.id}
      </h1>
    </main>
  );
}
