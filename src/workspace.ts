export type IssueSeverity = "error" | "warning";

export type ValidationIssue = {
  severity: IssueSeverity;
  source: "rubric.json" | "responses.jsonl" | "runtime" | "permalink";
  location: string;
  field: string;
  message: string;
  fix: string;
};

export type InputSummary = {
  criteriaCount: number;
  responseCount: number;
  missingLabelCount: number;
  issues: ValidationIssue[];
};

export type ScoreRow = {
  outputId: string;
  score: number | null;
  status: string;
  missingCriteria: string[];
};

export type ResultSummary = {
  averageScore: number | null;
  passRate: number | null;
  runtime: string;
  version: string;
  rows: ScoreRow[];
};

function issue(
  source: ValidationIssue["source"],
  location: string,
  field: string,
  message: string,
  fix: string,
  severity: IssueSeverity = "error",
): ValidationIssue {
  return { severity, source, location, field, message, fix };
}

export function validateInputs(rubricValue: string, responsesValue: string): InputSummary {
  const issues: ValidationIssue[] = [];
  let criteria: Array<Record<string, unknown>> = [];
  let responses: Array<Record<string, unknown>> = [];

  try {
    const rubric = JSON.parse(rubricValue);
    if (!rubric || typeof rubric !== "object" || Array.isArray(rubric)) {
      issues.push(issue("rubric.json", "root", "document", "Rubric must be a JSON object.", "Wrap the rubric fields in { }."));
    } else if (!Array.isArray(rubric.criteria)) {
      issues.push(
        issue("rubric.json", "root", "criteria", "Rubric is missing a criteria array.", 'Add "criteria": [{ ... }].'),
      );
    } else {
      criteria = rubric.criteria;
      if (criteria.length === 0) {
        issues.push(issue("rubric.json", "criteria", "criteria", "No scoring criteria are defined.", "Add at least one criterion."));
      }
      criteria.forEach((criterion, index) => {
        if (!criterion || typeof criterion !== "object" || Array.isArray(criterion)) {
          issues.push(
            issue("rubric.json", `criteria[${index}]`, "criterion", "Criterion must be an object.", "Replace it with a criterion object."),
          );
          return;
        }
        if (typeof criterion.criterion_id !== "string" || !criterion.criterion_id.trim()) {
          issues.push(
            issue(
              "rubric.json",
              `criteria[${index}]`,
              "criterion_id",
              "Criterion has no stable identifier.",
              "Add a non-empty criterion_id.",
            ),
          );
        }
      });
    }
  } catch (error) {
    issues.push(
      issue(
        "rubric.json",
        "document",
        "JSON",
        error instanceof Error ? error.message : "Rubric JSON is invalid.",
        "Correct the JSON syntax before running.",
      ),
    );
  }

  const lines = responsesValue.split("\n");
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    try {
      const response = JSON.parse(line);
      if (!response || typeof response !== "object" || Array.isArray(response)) {
        issues.push(
          issue(
            "responses.jsonl",
            `row ${index + 1}`,
            "row",
            "Each JSONL row must be an object.",
            "Replace the row with a JSON object.",
          ),
        );
        return;
      }
      responses.push(response);
    } catch (error) {
      issues.push(
        issue(
          "responses.jsonl",
          `row ${index + 1}`,
          "JSON",
          error instanceof Error ? error.message : "Response row is invalid JSON.",
          "Keep one valid JSON object on this line.",
        ),
      );
    }
  });

  if (responses.length === 0 && !issues.some((item) => item.source === "responses.jsonl")) {
    issues.push(
      issue(
        "responses.jsonl",
        "document",
        "rows",
        "No response rows are available to score.",
        "Import or add at least one JSONL response row.",
      ),
    );
  }

  const criterionIds = criteria
    .map((criterion) => criterion.criterion_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
  let missingLabelCount = 0;
  responses.forEach((response, responseIndex) => {
    const labels =
      response.labels && typeof response.labels === "object" && !Array.isArray(response.labels)
        ? (response.labels as Record<string, unknown>)
        : {};
    criterionIds.forEach((criterionId) => {
      if (!(criterionId in labels)) {
        missingLabelCount += 1;
        issues.push(
          issue(
            "responses.jsonl",
            `row ${responseIndex + 1}`,
            `labels.${criterionId}`,
            `Label for ${criterionId} is missing.`,
            `Add a numeric labels.${criterionId} value or mark the criterion not applicable.`,
            "warning",
          ),
        );
      }
    });
  });

  return {
    criteriaCount: criteria.length,
    responseCount: responses.length,
    missingLabelCount,
    issues,
  };
}

export function summarizeResult(value: string): ResultSummary {
  const empty: ResultSummary = {
    averageScore: null,
    passRate: null,
    runtime: "Not run",
    version: "Not loaded",
    rows: [],
  };
  if (!value) return empty;

  try {
    const parsed = JSON.parse(value);
    const rows = Array.isArray(parsed.outputs)
      ? parsed.outputs.map((output: Record<string, unknown>, index: number) => ({
          outputId: String(output.output_id ?? `output-${index + 1}`),
          score: typeof output.score === "number" ? output.score : null,
          status: output.passed === true ? "Passed" : output.passed === false ? "Below threshold" : "Scored",
          missingCriteria: Array.isArray(output.missing_criteria)
            ? output.missing_criteria.map((item) => String(item))
            : [],
        }))
      : typeof parsed.score === "number"
        ? [
            {
              outputId: "local-fallback",
              score: parsed.score,
              status: "Fallback score",
              missingCriteria: [],
            },
          ]
        : [];

    return {
      averageScore:
        typeof parsed.summary?.average_score === "number"
          ? parsed.summary.average_score
          : typeof parsed.average_score === "number"
            ? parsed.average_score
            : typeof parsed.score === "number"
              ? parsed.score
              : null,
      passRate: typeof parsed.summary?.pass_rate === "number" ? parsed.summary.pass_rate : null,
      runtime: typeof parsed.runtime === "string" ? parsed.runtime : "Complete",
      version: typeof parsed.evalkit_version === "string" ? parsed.evalkit_version : "Unavailable",
      rows,
    };
  } catch {
    return { ...empty, runtime: "Invalid output" };
  }
}
