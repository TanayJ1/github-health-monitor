import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Finding } from "@/types/finding";
import { getRepositoryFiles } from "@/services/githubRepository";
import { getRecentCommits } from "@/services/githubActivity";
import { getPullRequests } from "@/services/githubPullRequests";
import { getIssues } from "@/services/githubIssues";
import { getDependabotAlerts } from "@/services/githubDependabot";
import { analyzeRepositoryStructure } from "@/analyzers/repositoryStructure";
import { analyzeDocumentation } from "@/analyzers/documentation";
import {
  analyzeSecurity,
  detectSecretsInContent,
} from "@/analyzers/security";
import { analyzeDependencies } from "@/analyzers/dependencies";
import { analyzeTesting } from "@/analyzers/testing";
import { analyzeCICD } from "@/analyzers/cicd";
import { analyzeGitActivity } from "@/analyzers/gitActivity";
import { analyzePullRequests } from "@/analyzers/pullRequests";
import { analyzeIssues } from "@/analyzers/issues";
import { analyzeCodeQuality } from "@/analyzers/codeQuality";

import {
  calculateHealthScore,
  calculateHealthBreakdown,
} from "@/lib/healthScore";

import { NextResponse } from "next/server";
import { getGitHubFileContent } from "@/services/githubRepository";

export async function POST(request: Request) {
  let scanId: string | null = null;

  try {
    // --------------------------------------------------
    // 1. Parse request
    // --------------------------------------------------

    let body: { repositoryId?: string };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    const repositoryId = body.repositoryId;

    if (!repositoryId) {
      return NextResponse.json(
        {
          success: false,
          error: "repositoryId is required",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 2. Authenticate user
    // --------------------------------------------------

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 3. Verify repository ownership
    // --------------------------------------------------

    const repository = await db.repository.findFirst({
      where: {
        id: repositoryId,
        ownerId: user.id,
      },
    });

    if (!repository) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 4. Check GitHub authentication
    // --------------------------------------------------

    if (!user.githubAccessToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GitHub authentication expired. Please connect GitHub again.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 5. Prevent concurrent scans
    // --------------------------------------------------

    const runningScan = await db.scan.findFirst({
      where: {
        repositoryId: repository.id,
        status: "RUNNING",
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    if (runningScan) {
      return NextResponse.json(
        {
          success: false,
          error: "A scan is already running for this repository.",
          scanId: runningScan.id,
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 6. Create scan
    // --------------------------------------------------

    const scan = await db.scan.create({
      data: {
        repositoryId: repository.id,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    scanId = scan.id;

    // --------------------------------------------------
    // 7. Validate repository name
    // --------------------------------------------------

    const [owner, repo] = repository.fullName.split("/");

    if (!owner || !repo) {
      throw new Error(
        `Invalid GitHub repository name: ${repository.fullName}`
      );
    }

    // --------------------------------------------------
    // 8. Fetch GitHub repository data
    // --------------------------------------------------

    const files = await getRepositoryFiles(
      owner,
      repo,
      repository.defaultBranch,
      user.githubAccessToken
    );

    const commits = await getRecentCommits(
      owner,
      repo,
      repository.defaultBranch,
      user.githubAccessToken
    );

    const pullRequests = await getPullRequests(
      owner,
      repo,
      user.githubAccessToken
    );

    const issues = await getIssues(
      owner,
      repo,
      user.githubAccessToken
    );

    // --------------------------------------------------
    // 9. Run analyzers
    // --------------------------------------------------

    const structureFindings =
      analyzeRepositoryStructure(files);

    const documentationFindings =
      analyzeDocumentation(files);

    const securityFindings =
      analyzeSecurity(files);

        // --------------------------------------------------
    // 9.1 Scan file contents for exposed secrets
    // --------------------------------------------------

   const secretFindings: Finding[] = [];

    const scannableFiles = files
      .filter((file) => {
        const path = file.path.toLowerCase();

        return [
          ".js",
          ".jsx",
          ".ts",
          ".tsx",
          ".py",
          ".java",
          ".go",
          ".rs",
          ".php",
          ".rb",
          ".cs",
          ".cpp",
          ".c",
          ".json",
          ".yml",
          ".yaml",
          ".xml",
          ".properties",
          ".env",
          ".ini",
          ".cfg",
          ".conf",
        ].some((extension) => path.endsWith(extension));
      })
      .slice(0, 100);

    for (const file of scannableFiles) {
      try {
        const content = await getGitHubFileContent(
          owner,
          repo,
          file.path,
          user.githubAccessToken
        );

        if (!content) continue;

        const findings = detectSecretsInContent(
          file.path,
          content
        );

        secretFindings.push(...findings);
      } catch (error) {
        console.error(
          `Secret scan failed for ${file.path}:`,
          error
        );
      }
    }


   const dependabotAlerts = await getDependabotAlerts(
  owner,
  repo,
  user.githubAccessToken
);

const dependencyFindings = analyzeDependencies(
  files,
  dependabotAlerts
);

    const testingFindings =
      analyzeTesting(files);

    const cicdFindings =
      analyzeCICD(files);

    const gitActivityFindings =
      analyzeGitActivity(commits);

    const pullRequestFindings =
      analyzePullRequests(pullRequests);

    const issueFindings =
      analyzeIssues(issues);

    const codeQualityFindings =
      analyzeCodeQuality(files);

    // --------------------------------------------------
    // 10. Combine findings
    // --------------------------------------------------

    const findings = [
      ...structureFindings,
      ...documentationFindings,
      ...securityFindings,
      ...dependencyFindings,
      ...testingFindings,
      ...cicdFindings,
      ...gitActivityFindings,
      ...pullRequestFindings,
      ...issueFindings,
      ...codeQualityFindings,
      ...secretFindings,
    ];

    // --------------------------------------------------
    // 11. Calculate health score
    // --------------------------------------------------

    const healthScore =
      calculateHealthScore(findings);

    const breakdown =
      calculateHealthBreakdown(findings);

    // --------------------------------------------------
    // 12. Calculate finding statistics
    // --------------------------------------------------

    const criticalFindings = findings.filter(
      (finding) =>
        finding.severity === "CRITICAL"
    ).length;

    const highFindings = findings.filter(
      (finding) =>
        finding.severity === "HIGH"
    ).length;

    const mediumFindings = findings.filter(
      (finding) =>
        finding.severity === "MEDIUM"
    ).length;

    const lowFindings = findings.filter(
      (finding) =>
        finding.severity === "LOW"
    ).length;

    const infoFindings = findings.filter(
      (finding) =>
        finding.severity === "INFO"
    ).length;

    // --------------------------------------------------
    // 13. Calculate repository activity statistics
    // --------------------------------------------------

    const openPullRequests =
      pullRequests.filter(
        (pr) => pr.state === "open"
      ).length;

    const openIssues =
      issues.filter(
        (issue) => issue.state === "open"
      ).length;

    const contributors = new Set(
      commits
        .map(
          (commit) =>
            commit.author?.login
        )
        .filter(Boolean)
    ).size;

    // --------------------------------------------------
    // 14. Save findings
    // --------------------------------------------------

    if (findings.length > 0) {
      await db.finding.createMany({
        data: findings.map((finding) => ({
          repositoryId: repository.id,
          scanId: scan.id,
          category: finding.category,
          severity: finding.severity,
          title: finding.title,
          description: finding.description,
          file: finding.file,
          line: finding.line,
          rule: finding.rule,
          recommendation:
            finding.recommendation,
        })),
      });
    }

    // --------------------------------------------------
    // 15. Save metrics
    // --------------------------------------------------

    await db.metric.createMany({
      data: [
        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "SCAN",
          name: "files_analyzed",
          value: files.length,
        },
        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "SCAN",
          name: "total_findings",
          value: findings.length,
        },

        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "FINDINGS",
          name: "critical_findings",
          value: criticalFindings,
        },
        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "FINDINGS",
          name: "high_findings",
          value: highFindings,
        },
        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "FINDINGS",
          name: "medium_findings",
          value: mediumFindings,
        },
        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "FINDINGS",
          name: "low_findings",
          value: lowFindings,
        },
        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "FINDINGS",
          name: "info_findings",
          value: infoFindings,
        },

        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "GIT_ACTIVITY",
          name: "recent_commits",
          value: commits.length,
        },
        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "GIT_ACTIVITY",
          name: "contributors",
          value: contributors,
        },

        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "PULL_REQUEST",
          name: "open_pull_requests",
          value: openPullRequests,
        },

        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "ISSUE",
          name: "open_issues",
          value: openIssues,
        },

        {
          repositoryId: repository.id,
          scanId: scan.id,
          category: "HEALTH",
          name: "overall_score",
          value: healthScore,
        },

        ...Object.entries(breakdown).map(
          ([category, score]) => ({
            repositoryId: repository.id,
            scanId: scan.id,
            category,
            name: "category_score",
            value: score,
          })
        ),
      ],
    });

    // --------------------------------------------------
    // 16. Complete scan
    // --------------------------------------------------

    const completedAt = new Date();

    const completedScan =
      await db.scan.update({
        where: {
          id: scan.id,
        },
        data: {
          status: "COMPLETED",
          healthScore,
          completedAt,
        },
      });

    // --------------------------------------------------
    // 17. Update repository health
    // --------------------------------------------------

    await db.repository.update({
      where: {
        id: repository.id,
      },
      data: {
        healthScore,
        lastScannedAt: completedAt,
      },
    });

    // --------------------------------------------------
    // 18. Return scan result
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      scanId: completedScan.id,
      status: completedScan.status,

      repository: {
        id: repository.id,
        name: repository.name,
        fullName: repository.fullName,
      },

      filesAnalyzed: files.length,

      healthScore,

      breakdown,

      findings: findings.length,

      statistics: {
        critical: criticalFindings,
        high: highFindings,
        medium: mediumFindings,
        low: lowFindings,
        info: infoFindings,
      },

      activity: {
        recentCommits: commits.length,
        contributors,
        openPullRequests,
        openIssues,
      },

      details: findings,
    });
  } catch (error) {
    console.error("Scan error:", error);

    // --------------------------------------------------
    // 19. Mark scan as FAILED
    // --------------------------------------------------

    if (scanId) {
      try {
        await db.scan.update({
          where: {
            id: scanId,
          },
          data: {
            status: "FAILED",
            completedAt: new Date(),
          },
        });
      } catch (updateError) {
        console.error(
          "Failed to mark scan as FAILED:",
          updateError
        );
      }
    }

    // --------------------------------------------------
    // 20. Return safe error
    // --------------------------------------------------

    let errorMessage =
      "Repository scan failed";

    if (error instanceof Error) {
      if (
        error.message.includes(
          "GitHub API error 401"
        )
      ) {
        errorMessage =
          "GitHub authentication expired. Please connect GitHub again.";
      } else if (
        error.message.includes(
          "GitHub API error 403"
        )
      ) {
        errorMessage =
          "GitHub API access was denied. Please reconnect GitHub or check repository permissions.";
      } else if (
        error.message.includes(
          "GitHub API error 404"
        )
      ) {
        errorMessage =
          "GitHub repository could not be found. It may have been deleted or renamed.";
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}