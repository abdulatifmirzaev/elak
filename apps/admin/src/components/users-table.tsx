"use client";

import { useState } from "react";
import { Search, UserCheck, UserX, Shield } from "lucide-react";

export interface UserRow {
  id: string;
  telegramId: string;
  username: string | null;
  isActive: boolean;
  channelCount: number;
  interests: string[];
  createdAt: string;
}

export function UsersTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const tgId = u.telegramId.toLowerCase();
    const username = (u.username || "").toLowerCase();
    const interests = u.interests.join(" ").toLowerCase();
    return tgId.includes(term) || username.includes(term) || interests.includes(term);
  });

  const handleToggleStatus = async (userId: string) => {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/toggle`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: data.isActive } : u)),
      );
    } catch (err: unknown) {
      alert("Error: " + String(err));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search by username, TG ID, or interest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
        <p className="text-xs text-slate-500 self-center">
          Showing {filteredUsers.length} of {users.length} users
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Interests</th>
                <th className="px-6 py-3.5">Channels</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Registered</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {user.username ? `@${user.username}` : "Anonymous"}
                      </div>
                      <div className="font-mono text-xs text-slate-400">ID: {user.telegramId}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {user.interests.length > 0 ? (
                          user.interests.map((interest, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {interest}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">None selected</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-800">
                      {user.channelCount} {user.channelCount === 1 ? "channel" : "channels"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive ? "bg-emerald-500" : "bg-red-500"
                          }`}
                        />
                        {user.isActive ? "Active" : "Stopped (/stop)"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        disabled={loadingId === user.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          user.isActive
                            ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                        } disabled:opacity-50`}
                      >
                        {user.isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
