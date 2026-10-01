import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { Navbar } from "@/components/navbar";
import { UsersTable, UserRow } from "@/components/users-table";
import { prisma } from "@radar/database";

export const dynamic = "force-dynamic";

export default async function UsersAdminPage() {
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    redirect("/login");
  }

  const rawUsers = await prisma.user.findMany({
    include: {
      channels: true,
      interests: {
        include: {
          interest: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedUsers: UserRow[] = rawUsers.map((u) => ({
    id: u.id,
    telegramId: u.telegramId.toString(),
    username: u.username,
    isActive: u.isActive,
    channelCount: u.channels.length,
    interests: u.interests.map((ui) => ui.interest.name),
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, and manage registered Telegram subscribers and preferences
          </p>
        </div>

        <UsersTable initialUsers={formattedUsers} />
      </main>
    </div>
  );
}
