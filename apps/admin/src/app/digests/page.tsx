import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { prisma } from "@radar/database";
import { Send, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DigestsAdminPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect("/login");
  }

  const digests = await prisma.digest.findMany({
    take: 50,
    orderBy: {
      sentAt: "desc",
    },
  });

  // Fetch users for these digests
  const userIds = Array.from(new Set(digests.map((d) => d.userId)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true, telegramId: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Digest Delivery Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time audit log of all scheduled twice-daily digest dispatches
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Recipient User</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Included Items</th>
                  <th className="px-6 py-3.5">Dispatched At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {digests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      No digests logged yet.
                    </td>
                  </tr>
                ) : (
                  digests.map((digest) => {
                    const recipient = userMap.get(digest.userId);
                    return (
                      <tr key={digest.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">
                            {recipient?.username ? `@${recipient.username}` : "Anonymous User"}
                          </div>
                          <div className="font-mono text-xs text-slate-400">
                            TG:{" "}
                            {recipient?.telegramId
                              ? recipient.telegramId.toString()
                              : digest.userId}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              digest.status === "sent"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : digest.status === "skipped_no_updates"
                                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {digest.status === "sent" && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            {digest.status === "skipped_no_updates" && (
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            {digest.status === "failed" && (
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                            )}
                            <span>{digest.status}</span>
                          </span>
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-800">
                          {digest.postIds.length}{" "}
                          {digest.postIds.length === 1 ? "summary post" : "summary posts"}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(digest.sentAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
