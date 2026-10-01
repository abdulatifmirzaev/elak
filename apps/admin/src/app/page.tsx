import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { GrowthChart, DayGrowthData } from "@/components/growth-chart";
import { prisma } from "@radar/database";
import { Users, Rss, Send, CheckCircle2, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect("/login");
  }

  // 1. Fetch Summary Metrics
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    activeUsers,
    totalChannels,
    reachableChannels,
    digestsSentToday,
    totalSent,
    totalFailed,
    recentDigests,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.channel.count(),
    prisma.channel.count({ where: { isReachable: true } }),
    prisma.digest.count({
      where: {
        sentAt: { gte: todayMidnight },
        status: "sent",
      },
    }),
    prisma.digest.count({ where: { status: "sent" } }),
    prisma.digest.count({ where: { status: "failed" } }),
    prisma.digest.findMany({
      take: 6,
      orderBy: { sentAt: "desc" },
    }),
    prisma.user.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalAttempted = totalSent + totalFailed;
  const successRate =
    totalAttempted > 0 ? ((totalSent / totalAttempted) * 100).toFixed(1) : "100.0";

  // 2. Prepare 14-day growth data
  const growthMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]!;
    growthMap.set(dateStr, 0);
  }

  for (const u of recentUsers) {
    const dateStr = u.createdAt.toISOString().split("T")[0]!;
    if (growthMap.has(dateStr)) {
      growthMap.set(dateStr, (growthMap.get(dateStr) || 0) + 1);
    }
  }

  const chartData: DayGrowthData[] = Array.from(growthMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Operational Overview</h1>
            <p className="text-sm text-slate-500 mt-1">
              Live tracking metrics and user activity across the Telegram Radar ecosystem
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Bot & Worker Online
            </span>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Users */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Users
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalUsers}</p>
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-semibold text-emerald-600">{activeUsers} active</span> (
                {totalUsers - activeUsers} stopped)
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Tracked Channels */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Channels Tracked
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{totalChannels}</p>
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-semibold text-emerald-600">
                  {reachableChannels} reachable
                </span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Rss className="w-5 h-5" />
            </div>
          </div>

          {/* Digests Today */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Digests Sent Today
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{digestsSentToday}</p>
              <p className="text-xs text-slate-500 mt-1">Across 2 daily scheduled slots</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Send className="w-5 h-5" />
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Delivery Success
              </p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{successRate}%</p>
              <p className="text-xs text-slate-500 mt-1">
                {totalSent} sent / {totalFailed} failed
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Growth Chart Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">User Growth Trends</h2>
          </div>
          <GrowthChart data={chartData} />
        </div>

        {/* Recent Activity Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Recent Digest Dispatches</h2>
            <p className="text-xs text-slate-500 mt-1">Latest delivery job statuses</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Digest ID</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Included Posts</th>
                  <th className="px-6 py-3.5">Sent Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentDigests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No digests generated yet. Worker runs at 09:00 and 20:00 Tashkent time.
                    </td>
                  </tr>
                ) : (
                  recentDigests.map((digest) => (
                    <tr key={digest.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-900">
                        {digest.id.slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            digest.status === "sent"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : digest.status === "skipped_no_updates"
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {digest.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{digest.postIds.length} posts</td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(digest.sentAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
