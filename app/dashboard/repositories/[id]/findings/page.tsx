"use client";

import { useEffect, useState } from "react";

interface Finding {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  file?: string | null;
  line?: number | null;
  rule?: string | null;
  recommendation?: string | null;
  createdAt: string;
}

interface DashboardData {
  repository: {
    id: string;
    name: string;
    fullName: string;
    healthScore: number | null;
  };
  latestScan: {
    id: string;
    healthScore: number | null;
  } | null;
  findings: Finding[];
}

const categories = [
  "ALL",
  "SECURITY",
  "DEPENDENCY",
  "TESTING",
  "DOCUMENTATION",
  "CICD",
  "CODE_QUALITY",
  "GIT_ACTIVITY",
  "PULL_REQUEST",
  "ISSUE",
];

const severities = [
  "ALL",
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFO",
];

const categoryLabels: Record<string, string> = {
  SECURITY: "Security",
  DEPENDENCY: "Dependencies",
  TESTING: "Testing",
  DOCUMENTATION: "Documentation",
  CICD: "CI/CD",
  CODE_QUALITY: "Code Quality",
  GIT_ACTIVITY: "Git Activity",
  PULL_REQUEST: "Pull Requests",
  ISSUE: "Issues",
};

function getSeverityClass(severity: string) {
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
}

export default function FindingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [repositoryId, setRepositoryId] = useState<string | null>(null);

  const [severity, setSeverity] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFindings() {
      try {
        const { id } = await params;

        setRepositoryId(id);

        const response = await fetch(`/api/repositories/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch repository");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(
            result.error || "Failed to load findings"
          );
        }

        setData(result);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load findings"
        );
      } finally {
        setLoading(false);
      }
    }

    loadFindings();
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-72 bg-slate-800 rounded" />

            <div className="h-24 bg-slate-800 rounded-xl" />

            <div className="h-12 bg-slate-800 rounded-xl" />

            <div className="h-40 bg-slate-800 rounded-xl" />
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
              Failed to load findings
            </h1>

            <p className="text-slate-400 mt-2">
              {error || "Something went wrong."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const filteredFindings = data.findings.filter((finding) => {
    const severityMatches =
      severity === "ALL" ||
      finding.severity === severity;

    const categoryMatches =
      category === "ALL" ||
      finding.category === category;

    return severityMatches && categoryMatches;
  });

  const criticalCount = data.findings.filter(
    (finding) => finding.severity === "CRITICAL"
  ).length;

  const highCount = data.findings.filter(
    (finding) => finding.severity === "HIGH"
  ).length;

  const mediumCount = data.findings.filter(
    (finding) => finding.severity === "MEDIUM"
  ).length;

  const lowCount = data.findings.filter(
    (finding) => finding.severity === "LOW"
  ).length;

  const infoCount = data.findings.filter(
    (finding) => finding.severity === "INFO"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() =>
              window.location.href = `/dashboard/repositories/${repositoryId}`
            }
            className="text-sm text-slate-400 hover:text-white transition mb-4"
          >
            ← Back to Repository
          </button>

          <p className="text-sm text-slate-500 mb-1">
            Repository Findings
          </p>

          <h1 className="text-3xl font-bold">
            {data.repository.name}
          </h1>

          <p className="text-slate-400 mt-2">
            {data.repository.fullName}
          </p>
        </div>

        {/* Summary */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">

          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <p className="text-xs text-red-400">
              CRITICAL
            </p>

            <p className="text-3xl font-bold mt-2">
              {criticalCount}
            </p>
          </div>

          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">
            <p className="text-xs text-orange-400">
              HIGH
            </p>

            <p className="text-3xl font-bold mt-2">
              {highCount}
            </p>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
            <p className="text-xs text-yellow-400">
              MEDIUM
            </p>

            <p className="text-3xl font-bold mt-2">
              {mediumCount}
            </p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
            <p className="text-xs text-blue-400">
              LOW
            </p>

            <p className="text-3xl font-bold mt-2">
              {lowCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
            <p className="text-xs text-slate-400">
              INFO
            </p>

            <p className="text-3xl font-bold mt-2">
              {infoCount}
            </p>
          </div>

        </section>

        {/* Filters */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 mb-6">

          <div className="flex flex-col md:flex-row gap-4">

            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2">
                Severity
              </label>

              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value)
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                {severities.map((item) => (
                  <option key={item} value={item}>
                    {item === "ALL"
                      ? "All severities"
                      : item}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2">
                Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item === "ALL"
                      ? "All categories"
                      : categoryLabels[item] || item}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="mt-4 text-sm text-slate-500">
            Showing {filteredFindings.length} of{" "}
            {data.findings.length} findings
          </div>

        </section>

        {/* Findings */}
        <section>
          {filteredFindings.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <h2 className="text-xl font-semibold">
                No findings found
              </h2>

              <p className="text-slate-500 mt-2">
                No findings match the selected filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {filteredFindings.map((finding) => (
                <article
                  key={finding.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-6"
                >

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                    <div className="flex-1">

                      <div className="flex flex-wrap items-center gap-3 mb-3">

                        <span
                          className={`px-2.5 py-1 rounded-md border text-xs font-medium ${getSeverityClass(
                            finding.severity
                          )}`}
                        >
                          {finding.severity}
                        </span>

                        <span className="text-xs text-slate-500">
                          {categoryLabels[
                            finding.category
                          ] || finding.category}
                        </span>

                        {finding.rule && (
                          <span className="text-xs font-mono text-slate-600">
                            {finding.rule}
                          </span>
                        )}

                      </div>

                      <h2 className="text-lg font-semibold">
                        {finding.title}
                      </h2>

                      <p className="text-sm text-slate-400 mt-2 leading-6">
                        {finding.description}
                      </p>

                      {/* File */}
                      {finding.file && (
                        <div className="mt-4">
                          <span className="text-xs text-slate-500">
                            Location
                          </span>

                          <div className="mt-1 inline-flex bg-slate-950 border border-slate-800 rounded-md px-3 py-2">
                            <code className="text-sm text-slate-300">
                              {finding.file}
                              {finding.line
                                ? `:${finding.line}`
                                : ""}
                            </code>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Recommendation */}
                  {finding.recommendation && (
                    <div className="mt-5 border-t border-slate-800 pt-4">

                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        Recommendation
                      </p>

                      <p className="text-sm text-slate-300 mt-2 leading-6">
                        {finding.recommendation}
                      </p>

                    </div>
                  )}

                </article>
              ))}

            </div>
          )}
        </section>

      </div>
    </main>
  );
}