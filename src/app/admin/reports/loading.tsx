export default function AdminReportsLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
        Loading Event Reports...
      </p>
    </div>
  );
}
