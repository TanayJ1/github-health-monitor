import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-xl font-bold">
            GitHub Health Monitor
          </div>

          <a
            href="/api/auth/github"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Sign in with GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-6 py-20">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
            🚀 AI-powered GitHub codebase monitoring
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Know the health of your
            <span className="text-blue-400"> codebase.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            GitHub Health Monitor analyzes your repositories for security,
            dependencies, testing, documentation, CI/CD, code quality and
            engineering activity — then gives your codebase a simple health
            score.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="/api/auth/github"
              className="rounded-lg bg-blue-500 px-6 py-3 text-center font-semibold text-white transition hover:bg-blue-600"
            >
              Connect GitHub →
            </a>

            <Link
              href="#features"
              className="rounded-lg border border-slate-700 px-6 py-3 text-center font-semibold text-slate-200 transition hover:bg-slate-900"
            >
              Explore features
            </Link>
          </div>

          {/* Score preview */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Health Score</p>
              <p className="mt-2 text-4xl font-bold text-green-400">99</p>
              <p className="mt-1 text-sm text-slate-500">Excellent</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Security</p>
              <p className="mt-2 text-4xl font-bold text-green-400">100</p>
              <p className="mt-1 text-sm text-slate-500">No critical issues</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">Categories</p>
              <p className="mt-2 text-4xl font-bold text-blue-400">9</p>
              <p className="mt-1 text-sm text-slate-500">Analyzed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-slate-800 bg-slate-900/40"
      >
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold">
              Everything you need to understand your repository
            </h2>

            <p className="mt-4 text-slate-400">
              One dashboard for the engineering health signals that matter.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Security",
                description:
                  "Detect potentially exposed secrets and security risks in your repository.",
              },
              {
                title: "Dependencies",
                description:
                  "Understand your dependency setup and identify areas that need attention.",
              },
              {
                title: "Testing",
                description:
                  "Monitor test coverage signals, test structure and testing configuration.",
              },
              {
                title: "CI/CD",
                description:
                  "Check whether your repository has healthy automation and workflows.",
              },
              {
                title: "Code Quality",
                description:
                  "Identify repository structure and code-quality issues.",
              },
              {
                title: "Engineering Activity",
                description:
                  "Analyze commits, pull requests and issues to understand development activity.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-800 bg-slate-950 p-6"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-slate-500">
          GitHub Health Monitor — AI-powered engineering health monitoring.
        </div>
      </footer>
    </main>
  );
}