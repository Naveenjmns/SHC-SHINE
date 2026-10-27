export default function AdminReportsLoading() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-semibold text-ink-muted">
        Loading Event Reports...
      </p>
    </div>
  );
}
