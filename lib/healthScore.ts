import { Finding } from "@/types/finding";

const SEVERITY_PENALTIES: Record<
  Finding["severity"],
  number
> = {
  CRITICAL: 25,
  HIGH: 15,
  MEDIUM: 8,
  LOW: 3,
  INFO: 0,
};

const CATEGORY_WEIGHTS: Record<
  Finding["category"],
  number
> = {
  SECURITY: 25,
  CODE_QUALITY: 20,
  DEPENDENCY: 10,
  TESTING: 10,
  DOCUMENTATION: 5,
  CICD: 5,
  GIT_ACTIVITY: 5,
  PULL_REQUEST: 10,
  ISSUE: 10,
};

export function calculateCategoryScore(
  findings: Finding[],
  category: Finding["category"]
): number {
  const categoryFindings = findings.filter(
    (finding) => finding.category === category
  );

  let score = 100;

  for (const finding of categoryFindings) {
    score -= SEVERITY_PENALTIES[finding.severity];
  }

  return Math.max(0, score);
}

export function calculateHealthScore(
  findings: Finding[]
): number {
  const categories = Object.keys(
    CATEGORY_WEIGHTS
  ) as Finding["category"][];

  let weightedScore = 0;
  let totalWeight = 0;

  for (const category of categories) {
    const categoryScore = calculateCategoryScore(
      findings,
      category
    );

    const weight = CATEGORY_WEIGHTS[category];

    weightedScore += categoryScore * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return 100;
  }

  return Math.round(weightedScore / totalWeight);
}

export function calculateHealthBreakdown(
  findings: Finding[]
) {
  const categories = Object.keys(
    CATEGORY_WEIGHTS
  ) as Finding["category"][];

  const breakdown = {} as Record<
    Finding["category"],
    number
  >;

  for (const category of categories) {
    breakdown[category] = calculateCategoryScore(
      findings,
      category
    );
  }

  return breakdown;
}