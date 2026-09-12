"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Repository {
  id: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  language: string | null;
  isPrivate: boolean;
  healthScore: number | null;
  lastScannedAt: string | null;
}

interface User {
  username: string;
  avatarUrl: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const meResponse = await fetch("/api/auth/me");
        const me = await meResponse.json();

        if (!me.authenticated) {
          window.location.href = "/";
          return;
        }

        setUser(me.user);

        const repoResponse = await fetch("/api/github/repos");
        const repoData = await repoResponse.json();

        if (!repoResponse.ok || !repoData.success) {
          throw new Error(repoData.error || "Failed to load repositories");
        }

        setRepositories(repoData.repositories);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-slate-400">Loading your repositories...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <nav className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold">
              GitHub Health Monitor
            </h1>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-9 w-9 rounded-full"
                />
              )}

              <span className="text-sm text-slate-300">
                {user.username}
              </span>
            </div>
          )}
        </div>
      </nav>

      {/* Main */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <h2 className="text-3xl font-bold">
            Your repositories
          </h2>

          <p className="mt-2 text-slate-400">
            Select a repository to view its engineering health.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-800 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {!error && repositories.length === 0 && (
          <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h3 className="text-xl font-semibold">
              No repositories found
            </h3>

            <p className="mt-2 text-slate-400">
              We couldn't find any repositories associated with your
              GitHub account.
            </p>
          </div>
        )}

        {/* Repository cards */}
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {repositories.map((repo) => (
            <Link
              key={repo.id}
              href={`/dashboard/repositories/${repo.id}`}
              className="group rounded-xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-600 hover:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold group-hover:text-blue-400">
                    {repo.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {repo.fullName}
                  </p>
                </div>

                {repo.isPrivate && (
                  <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400">
                    Private
                  </span>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Language
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {repo.language || "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Branch
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {repo.defaultBranch}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs text-slate-500">
                  Health Score
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {repo.healthScore !== null
                    ? `${repo.healthScore}/100`
                    : "Not scanned"}
                </p>
              </div>

              <div className="mt-5 text-sm font-medium text-blue-400">
                View repository →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}