import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { ChannelsTable, ChannelRow } from "@/components/channels-table";
import { prisma } from "@radar/database";

export const dynamic = "force-dynamic";

export default async function ChannelsAdminPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect("/login");
  }

  const rawChannels = await prisma.channel.findMany({
    include: {
      users: true,
      posts: true,
    },
    orderBy: {
      users: {
        _count: "desc",
      },
    },
  });

  const formattedChannels: ChannelRow[] = rawChannels.map((c) => ({
    id: c.id,
    username: c.username,
    title: c.title,
    isReachable: c.isReachable,
    lastScrapedAt: c.lastScrapedAt ? c.lastScrapedAt.toISOString() : null,
    subscriberCount: c.users.length,
    postCount: c.posts.length,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tracked Channels</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor scraping status, reachability, and subscriber demand for all tracked channels
          </p>
        </div>

        <ChannelsTable initialChannels={formattedChannels} />
      </main>
    </div>
  );
}
