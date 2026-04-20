export default function AgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="min-h-screen px-4 py-24 text-foreground">
      <h1 className="font-display text-2xl font-semibold">Agent {params.id}</h1>
    </main>
  );
}
