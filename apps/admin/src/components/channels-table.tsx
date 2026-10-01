"use client";

import { useState } from "react";
import { Search, ExternalLink, CheckCircle, AlertTriangle } from "lucide-react";

export interface ChannelRow {
  id: string;
  username: string;
  title: string | null;
  isReachable: boolean;
  lastScrapedAt: string | null;
  subscriberCount: number;
  postCount: number;
}

export function ChannelsTable({ initialChannels }: { initialChannels: ChannelRow[] }) {
  const [channels] = useState<ChannelRow[]>(initialChannels);
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = channels.filter((c) => {
    const term = searchTerm.toLowerCase();
    const username = c.username.toLowerCase();
    const title = (c.title || "").toLowerCase();
    return username.includes(term) || title.includes(term);
  });

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search channels by username or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
        <p className="text-xs text-slate-500 self-center">
          Showing {filtered.length} of {channels.length} channels
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Channel</th>
                <th className="px-6 py-3.5">Subscribers</th>
                <th className="px-6 py-3.5">Reachability</th>
                <th className="px-6 py-3.5">Last Scraped</th>
                <th className="px-6 py-3.5">Cached Posts</th>
                <th className="px-6 py-3.5 text-right">Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No channels found matching search term.
                  </td>
                </tr>
              ) : (
                filtered.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {ch.title || `@${ch.username}`}
                      </div>
                      <div className="text-xs text-slate-400">@{ch.username}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">{ch.subscriberCount}</span>
                      <span className="text-xs text-slate-400 ml-1">users</span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          ch.isReachable
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ch.isReachable ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Reachable</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Unreachable / Private</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {ch.lastScrapedAt
                        ? new Date(ch.lastScrapedAt).toLocaleString()
                        : "Never scraped"}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-800">
                      {ch.postCount} posts
                    </td>

                    <td className="px-6 py-4 text-right">
                      <a
                        href={`https://t.me/s/${ch.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
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
