import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <h1 className="text-2xl font-semibold">CRUD Scaffold</h1>
    </main>
  );
}
