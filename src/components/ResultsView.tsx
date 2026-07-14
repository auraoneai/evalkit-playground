import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import type { ResultSummary, ValidationIssue } from "../workspace";

type ResultsViewProps = {
  runState: "ready" | "running" | "complete" | "failed";
  summary: ResultSummary;
  issues: ValidationIssue[];
  rawValue: string;
};

function score(value: number | null) {
  return value === null ? "--" : value.toFixed(3);
}

export function ResultsView({ runState, summary, issues, rawValue }: ResultsViewProps) {
  const errors = issues.filter((item) => item.severity === "error");
  const stateLabel =
    runState === "running" ? "Evaluation running" : runState === "complete" ? "Evidence ready" : runState === "failed" ? "Action required" : "Ready to run";
  const StateIcon = runState === "complete" ? CheckCircle2 : runState === "failed" ? AlertTriangle : CircleDashed;

  return (
    <section className="results-pane" aria-labelledby="results-title">
      <header className="results-header">
        <div>
          <p className="eyebrow">Evaluation evidence</p>
          <h2 id="results-title">Results</h2>
        </div>
        <span className={`status-label status-label--${runState}`} role="status" aria-live="polite">
          <StateIcon aria-hidden="true" size={16} />
          {stateLabel}
        </span>
      </header>

      <dl className="summary-grid" aria-label="Run summary">
        <div>
          <dt>Average score</dt>
          <dd>{score(summary.averageScore)}</dd>
        </div>
        <div>
          <dt>Pass rate</dt>
          <dd>{summary.passRate === null ? "--" : `${Math.round(summary.passRate * 100)}%`}</dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>{summary.runtime}</dd>
        </div>
      </dl>

      <section className="evidence-section" aria-labelledby="score-table-title">
        <div className="section-heading">
          <h3 id="score-table-title">Exact scores</h3>
          <span>{summary.rows.length} outputs</span>
        </div>
        {summary.rows.length ? (
          <div className="table-scroll" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Output</th>
                  <th scope="col">Score</th>
                  <th scope="col">Status</th>
                  <th scope="col">Missing labels</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((row) => (
                  <tr key={row.outputId}>
                    <th scope="row">{row.outputId}</th>
                    <td className="numeric">{score(row.score)}</td>
                    <td>{row.status}</td>
                    <td>{row.missingCriteria.length ? row.missingCriteria.join(", ") : "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <CircleDashed aria-hidden="true" size={22} />
            <strong>No run evidence yet</strong>
            <p>Validate the inputs, then run the evaluation to populate exact output scores.</p>
          </div>
        )}
      </section>

      <section className="evidence-section" aria-labelledby="diagnostics-title">
        <div className="section-heading">
          <h3 id="diagnostics-title">Diagnostics</h3>
          <span>{issues.length} issues</span>
        </div>
        {issues.length ? (
          <div className="issue-list">
            {issues.map((item, index) => (
              <article className={`issue issue--${item.severity}`} key={`${item.source}-${item.location}-${item.field}-${index}`}>
                <AlertTriangle aria-hidden="true" size={17} />
                <div>
                  <strong>
                    {item.source} / {item.location} / {item.field}
                  </strong>
                  <p>{item.message}</p>
                  <span>Fix: {item.fix}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="clean-state">
            <CheckCircle2 aria-hidden="true" size={18} />
            Inputs pass browser validation.
          </p>
        )}
        {errors.length > 0 ? <p className="blocking-note">{errors.length} blocking issue(s) must be fixed before running.</p> : null}
      </section>

      <details className="raw-output">
        <summary>Raw result JSON</summary>
        <pre>{rawValue || '{\n  "status": "ready"\n}'}</pre>
      </details>
    </section>
  );
}
