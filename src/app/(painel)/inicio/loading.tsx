export default function Carregando() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Carregando...</span>
      <div className="mb-8 h-10 w-64 rounded-md bg-soft" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-28 rounded-lg bg-soft" />
        <div className="h-28 rounded-lg bg-soft" />
        <div className="h-28 rounded-lg bg-soft" />
      </div>
      <div className="mt-6 h-64 rounded-lg bg-soft" />
    </div>
  );
}
