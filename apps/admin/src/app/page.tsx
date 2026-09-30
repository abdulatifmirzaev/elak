export default function AdminHomePage() {
  return (
    <main className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Telegram Radar Admin</h1>
          <p className="text-sm text-slate-500">Internal management & metrics portal</p>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Users</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Tracked Channels</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Digests Sent Today</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
        </div>
      </div>
    </main>
  );
}
