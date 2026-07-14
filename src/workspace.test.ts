import assert from "node:assert/strict";
import { examples } from "./examples/tutorial";
import { summarizeResult, validateInputs } from "./workspace";

for (const example of examples) {
  const summary = validateInputs(example.rubric, example.responses);
  assert.equal(summary.issues.filter((issue) => issue.severity === "error").length, 0);
  assert.ok(summary.criteriaCount > 0);
  assert.ok(summary.responseCount > 0);
}

const invalid = validateInputs('{"criteria": [}', '{"output_id":"one"}\nnot-json');
assert.ok(invalid.issues.some((issue) => issue.source === "rubric.json" && issue.severity === "error"));
assert.ok(invalid.issues.some((issue) => issue.source === "responses.jsonl" && issue.location === "row 2"));

const missing = validateInputs(
  '{"criteria":[{"criterion_id":"quality"}]}',
  '{"output_id":"one","labels":{}}',
);
assert.equal(missing.missingLabelCount, 1);
assert.ok(missing.issues.some((issue) => issue.field === "labels.quality" && issue.severity === "warning"));

const result = summarizeResult(
  JSON.stringify({
    runtime: "pyodide",
    evalkit_version: "1.2.3",
    summary: { average_score: 0.75, pass_rate: 0.5 },
    outputs: [{ output_id: "out-1", score: 0.75, passed: true, missing_criteria: [] }],
  }),
);
assert.equal(result.averageScore, 0.75);
assert.equal(result.rows[0].status, "Passed");
