"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Finding {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  recommendation?: string | null;
}

interface Metric {
  id: string;
  category: string;
  name: string;
  value: number;
}

interface ScanHistory {
  id: string;
  healthScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface DashboardData {
  repository: {
    id: string;
    name: string;
    fullName: string;
    defaultBranch: string;
    language: string | null;
    isPrivate: boolean;
    healthScore: number | null;
    lastScannedAt: string | null;
  };

  latestScan: {
    id: string;
    status: string;
    healthScore: number | null;
    startedAt: string | null;
    completedAt: string | null;
  } | null;

  findings: Finding[];
  metrics: Metric[];
  scanHistory: ScanHistory[];
}

const categoryLabels: Record<string, string> = {
  SECURITY: "Security",
  CODE_QUALITY: "Code Quality",
  DEPENDENCY: "Dependencies",
  TESTING: "Testing",
  DOCUMENTATION: "Documentation",
  CICD: "CI/CD",
  GIT_ACTIVITY: "Git Activity",
  PULL_REQUEST: "Pull Requests",
  ISSUE: "Issues",
};

const severityLabels = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFO",
];

export default function RepositoryDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [repositoryId, setRepositoryId] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { id } = await params;

        setRepositoryId(id);

        const response = await fetch(`/api/repositories/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch repository");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load dashboard");
        }

        setData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to load repository dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [params]);

  if (loading) {
    
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-72 bg-slate-800 rounded" />
            <div className="h-40 bg-slate-800 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-32 bg-slate-800 rounded-xl" />
              <div className="h-32 bg-slate-800 rounded-xl" />
              <div className="h-32 bg-slate-800 rounded-xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-6">
            <h1 className="text-xl font-semibold">
              Failed to load dashboard
            </h1>

            <p className="text-slate-400 mt-2">
              {error || "Something went wrong."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const completedHistory = data.scanHistory.filter(
  (scan) => scan.healthScore !== null
);

const currentScore =
  completedHistory.length > 0
    ? completedHistory[0].healthScore
    : null;

const previousScore =
  completedHistory.length > 1
    ? completedHistory[1].healthScore
    : null;

const scoreChange =
  currentScore !== null &&
  previousScore !== null
    ? currentScore - previousScore
    : null;

const bestScore =
  completedHistory.length > 0
    ? Math.max(
        ...completedHistory.map(
          (scan) => scan.healthScore ?? 0
        )
      )
    : null;

  const categoryScores = data.metrics.filter(
    (metric) => metric.name === "category_score"
  );

  const severityCounts = severityLabels.map((severity) => ({
    severity,
    count: data.findings.filter(
      (finding) => finding.severity === severity
    ).length,
  }));

const historyData = [...data.scanHistory]
  .reverse()
  .filter((scan) => scan.healthScore !== null)
  .map((scan, index, scans) => ({
    date: new Date(scan.createdAt).toLocaleDateString(),
    score: scan.healthScore,
    scan: index + 1,
    change:
      index > 0
        ? (scan.healthScore ?? 0) -
          (scans[index - 1].healthScore ?? 0)
        : 0,
  }));

  const getScoreStatus = (score: number | null) => {
    if (score === null) return "Not scanned";

    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Needs attention";
    if (score >= 40) return "Poor";

    return "Critical";
  };

  const getScoreClass = (score: number | null) => {
    if (score === null) return "text-slate-400";
    if (score >= 90) return "text-emerald-400";
    if (score >= 75) return "text-blue-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";

    return "text-red-400";
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-400 border-red-500/20";

      case "HIGH":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";

      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

      case "LOW":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";

      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-slate-500 mb-1">
              Repository Health
            </p>

            <h1 className="text-3xl font-bold">
              {data.repository.name}
            </h1>

            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
              <span>{data.repository.fullName}</span>

              <span>•</span>

              <span>
                {data.repository.defaultBranch}
              </span>

              {data.repository.language && (
                <>
                  <span>•</span>
                  <span>{data.repository.language}</span>
                </>
              )}
            </div>
          </div>

          <button
  onClick={async () => {
    if (!repositoryId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositoryId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Repository scan failed"
        );
      }

      window.location.reload();
    } catch (err) {
      console.error(err);

      setLoading(false);
      setError(
        err instanceof Error
          ? err.message
          : "Repository scan failed"
      );
    }
  }}
  disabled={loading}
  className="px-4 py-2 rounded-lg bg-white text-slate-950 font-medium hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? "Scanning..." : "Scan Repository"}
</button>
        </div>

        {/* Health Score */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

            <div>
              <p className="text-slate-400 text-sm mb-3">
                Overall Health Score
              </p>

              <div className="flex items-end gap-4">
                <span
                  className={`text-7xl font-bold ${getScoreClass(
                    data.repository.healthScore
                  )}`}
                >
                  {data.repository.healthScore ?? "—"}
                </span>

                <span className="text-slate-500 text-xl mb-3">
                  / 100
                </span>
              </div>

              <p
                className={`mt-3 font-medium ${getScoreClass(
                  data.repository.healthScore
                )}`}
              >
                {getScoreStatus(data.repository.healthScore)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/60 rounded-xl p-5">
                <p className="text-sm text-slate-500">
                  Files analyzed
                </p>

                <p className="text-2xl font-semibold mt-1">
                  {
                    data.metrics.find(
                      (metric) =>
                        metric.name === "files_analyzed"
                    )?.value ?? 0
                  }
                </p>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-5">
                <p className="text-sm text-slate-500">
                  Findings
                </p>

                <p className="text-2xl font-semibold mt-1">
                  {
                    data.metrics.find(
                      (metric) =>
                        metric.name === "total_findings"
                    )?.value ?? 0
                  }
                </p>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-5">
                <p className="text-sm text-slate-500">
                  Commits analyzed
                </p>

                <p className="text-2xl font-semibold mt-1">
                  {
                    data.metrics.find(
                      (metric) =>
                        metric.name === "recent_commits"
                    )?.value ?? 0
                  }
                </p>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-5">
                <p className="text-sm text-slate-500">
                  Last scan
                </p>

                <p className="text-sm font-medium mt-2">
                  {data.repository.lastScannedAt
                    ? new Date(
                        data.repository.lastScannedAt
                      ).toLocaleString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

  {/* Score Change */}
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
    <p className="text-sm text-slate-500">
      Score Change
    </p>

    <p
      className={`text-3xl font-bold mt-2 ${
        scoreChange === null
          ? "text-slate-400"
          : scoreChange > 0
          ? "text-emerald-400"
          : scoreChange < 0
          ? "text-red-400"
          : "text-slate-300"
      }`}
    >
      {scoreChange === null
        ? "—"
        : scoreChange > 0
        ? `+${scoreChange}`
        : scoreChange}
    </p>

    <p className="text-xs text-slate-500 mt-1">
      Compared with previous scan
    </p>
  </div>

  {/* Best Score */}
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
    <p className="text-sm text-slate-500">
      Best Score
    </p>

    <p className="text-3xl font-bold mt-2 text-emerald-400">
      {bestScore ?? "—"}
    </p>

    <p className="text-xs text-slate-500 mt-1">
      Highest recorded health score
    </p>
  </div>

  {/* Completed Scans */}
  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
    <p className="text-sm text-slate-500">
      Completed Scans
    </p>

    <p className="text-3xl font-bold mt-2">
      {completedHistory.length}
    </p>

    <p className="text-xs text-slate-500 mt-1">
      Historical completed scans
    </p>
  </div>

</section>

        {/* Category Scores */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Health Breakdown
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryScores.map((metric) => (
              <div
                key={metric.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">
                    {categoryLabels[metric.category] ||
                      metric.category}
                  </span>

                  <span
                    className={`text-xl font-bold ${getScoreClass(
                      metric.value
                    )}`}
                  >
                    {metric.value}
                  </span>
                </div>

                <div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-current rounded-full"
                    style={{
                      width: `${metric.value}%`,
                      color:
                        metric.value >= 90
                          ? "rgb(52 211 153)"
                          : metric.value >= 75
                          ? "rgb(96 165 250)"
                          : metric.value >= 60
                          ? "rgb(250 204 21)"
                          : "rgb(248 113 113)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Findings Summary */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Findings Summary
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {severityCounts.map((item) => (
              <div
                key={item.severity}
                className={`rounded-xl border p-5 ${getSeverityClass(
                  item.severity
                )}`}
              >
                <p className="text-xs font-medium">
                  {item.severity}
                </p>

                <p className="text-3xl font-bold mt-2">
                  {item.count}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Health History */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">
            Health History
          </h2>

          {historyData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
  <CartesianGrid strokeDasharray="3 3" />

  <XAxis dataKey="date" />

  <YAxis
    domain={[0, 100]}
  />

  <Tooltip />

  <Line
    type="monotone"
    dataKey="score"
    strokeWidth={3}
    dot
  />
</LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500">
              Not enough scan history yet.
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 mb-8">

  <div className="flex items-center justify-between mb-6">

    <div>
      <h2 className="text-xl font-semibold">
        Scan History
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Recent repository health scans
      </p>
    </div>

    <span className="text-sm text-slate-500">
      {completedHistory.length} scans
    </span>

  </div>

  {completedHistory.length === 0 ? (

    <div className="text-center py-8">
      <p className="text-slate-500">
        No completed scans yet.
      </p>
    </div>

  ) : (

    <div className="overflow-x-auto">

      <table className="w-full text-sm">

        <thead>
          <tr className="border-b border-slate-800 text-left">

            <th className="py-3 text-slate-500 font-medium">
              Scan
            </th>

            <th className="py-3 text-slate-500 font-medium">
              Date
            </th>

            <th className="py-3 text-slate-500 font-medium">
              Health Score
            </th>

            <th className="py-3 text-slate-500 font-medium">
              Change
            </th>

          </tr>
        </thead>

        <tbody>

          {completedHistory.map((scan, index) => {

            const previous =
              index < completedHistory.length - 1
                ? completedHistory[index + 1].healthScore
                : null;

            const change =
              previous !== null &&
              scan.healthScore !== null
                ? scan.healthScore - previous
                : null;

            return (
              <tr
                key={scan.id}
                className="border-b border-slate-800/60"
              >

                <td className="py-4">
                  #{completedHistory.length - index}
                </td>

                <td className="py-4 text-slate-400">
                  {new Date(
                    scan.createdAt
                  ).toLocaleString()}
                </td>

                <td
                  className={`py-4 font-semibold ${getScoreClass(
                    scan.healthScore
                  )}`}
                >
                  {scan.healthScore}
                </td>

                <td className="py-4">

                  {change === null ? (

                    <span className="text-slate-500">
                      —
                    </span>

                  ) : change > 0 ? (

                    <span className="text-emerald-400">
                      +{change}
                    </span>

                  ) : change < 0 ? (

                    <span className="text-red-400">
                      {change}
                    </span>

                  ) : (

                    <span className="text-slate-400">
                      0
                    </span>

                  )}

                </td>

              </tr>
            );
          })}

        </tbody>

      </table>

    </div>

  )}

</section>

        {/* Latest Findings */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Latest Findings
            </h2>

            <span className="text-sm text-slate-500">
              {data.findings.length} findings
            </span>
          </div>

          {data.findings.length === 0 ? (
            <p className="text-slate-500">
              No findings detected.
            </p>
          ) : (
            <div className="space-y-3">
              {data.findings.map((finding) => (
                <div
                  key={finding.id}
                  className="border border-slate-800 rounded-xl p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-2 py-1 rounded-md border text-xs font-medium ${getSeverityClass(
                            finding.severity
                          )}`}
                        >
                          {finding.severity}
                        </span>

                        <span className="text-xs text-slate-500">
                          {categoryLabels[finding.category] ||
                            finding.category}
                        </span>
                      </div>

                      <h3 className="font-medium">
                        {finding.title}
                      </h3>

                      <p className="text-sm text-slate-400 mt-1">
                        {finding.description}
                      </p>
                    </div>
                  </div>

                  {finding.recommendation && (
                    <div className="mt-3 text-sm text-slate-500 border-t border-slate-800 pt-3">
                      <span className="text-slate-400">
                        Recommendation:
                      </span>{" "}
                      {finding.recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}