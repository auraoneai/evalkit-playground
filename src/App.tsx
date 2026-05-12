import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { runEvalkitInBrowser, decodePermalink, encodePermalink } from "./pyodide_loader";
import "./App.css";
import { RubricEditor } from "./components/RubricEditor";
import { ResponsesEditor } from "./components/ResponsesEditor";
import { ResultsView } from "./components/ResultsView";
import { examples, tutorialRubric, tutorialResponses } from "./examples/tutorial";

type RunState = "ready" | "running" | "complete" | "failed";

function parseRubricCriteria(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed.criteria) ? parsed.criteria.length : 0;
  } catch {
    return 0;
  }
}

function countResponseRows(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function summarizeResult(value: string) {
  if (!value) {
    return {
      averageScore: "--",
      runtime: "idle",
      version: "--",
    };
  }

  try {
    const parsed = JSON.parse(value);
    const score = parsed.average_score ?? parsed.score ?? parsed.summary?.average_score;
    return {
      averageScore: typeof score === "number" ? score.toFixed(2) : "--",
      runtime: parsed.runtime ?? "complete",
      version: parsed.evalkit_version ?? "--",
    };
  } catch {
    return {
      averageScore: "--",
      runtime: "invalid",
      version: "--",
    };
  }
}

export default function App() {
  const [rubric, setRubric] = useState(tutorialRubric);
  const [responses, setResponses] = useState(tutorialResponses);
  const [result, setResult] = useState("");
  const [activeExample, setActiveExample] = useState(examples[0].id);
  const [running, setRunning] = useState(false);
  const [runState, setRunState] = useState<RunState>("ready");
  const [shareLabel, setShareLabel] = useState("Copy link");

  useEffect(() => {
    if (!location.hash) return;
    try {
      const decoded = decodePermalink(location.hash.slice(1));
      if (typeof decoded.rubric === "string") setRubric(decoded.rubric);
      if (typeof decoded.responses === "string") setResponses(decoded.responses);
      setActiveExample("custom");
    } catch {
      history.replaceState(null, "", location.pathname);
    }
  }, []);

  function loadExample(exampleId: string) {
    const example = examples.find((item) => item.id === exampleId);
    if (!example) return;
    setRubric(example.rubric);
    setResponses(example.responses);
    setResult("");
    setActiveExample(exampleId);
    setRunState("ready");
    setShareLabel("Copy link");
    history.replaceState(null, "", location.pathname);
  }

  async function run() {
    setRunning(true);
    setRunState("running");
    try {
      const out = await runEvalkitInBrowser(rubric, responses);
      setResult(JSON.stringify(out, null, 2));
      location.hash = encodePermalink(rubric, responses);
      setRunState("complete");
    } catch (error) {
      setResult(
        JSON.stringify(
          {
            runtime: "browser",
            error: error instanceof Error ? error.message : String(error),
          },
          null,
          2,
        ),
      );
      setRunState("failed");
    } finally {
      setRunning(false);
    }
  }

  async function copyPermalink() {
    const hash = encodePermalink(rubric, responses);
    const url = `${location.origin}${location.pathname}#${hash}`;
    history.replaceState(null, "", `${location.pathname}#${hash}`);
    try {
      await navigator.clipboard?.writeText(url);
      setShareLabel("Copied");
    } catch {
      setShareLabel("Link ready");
    }
    window.setTimeout(() => setShareLabel("Copy link"), 1600);
  }

  const criteriaCount = parseRubricCriteria(rubric);
  const responseCount = countResponseRows(responses);
  const resultSummary = summarizeResult(result);
  const selectedExampleLabel = examples.find((example) => example.id === activeExample)?.label ?? "Custom";

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup" aria-label="AuraOne EvalKit Playground">
          <span className="brand-mark">A</span>
          <div>
            <p className="eyebrow">AuraOne Open Source</p>
            <h1>EvalKit Playground</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <span className={`runtime-badge runtime-badge--${runState}`}>
            <span className="status-dot" />
            {runState === "running" ? "Running Pyodide" : runState === "failed" ? "Check output" : "Browser runtime"}
          </span>
          <button className="ghost-action" type="button" onClick={copyPermalink}>
            {shareLabel}
          </button>
          <button className="primary-action" type="button" onClick={run} disabled={running}>
            {running ? "Running" : "Run eval"}
          </button>
        </div>
      </header>

      <section className="workspace" aria-label="EvalKit browser workspace">
        <aside className="control-rail">
          <section className="control-panel">
            <div className="panel-heading">
              <p className="eyebrow">Scenario</p>
              <h2>{selectedExampleLabel}</h2>
            </div>
            <div className="example-list" role="tablist" aria-label="Example datasets">
              {examples.map((example) => (
                <button
                  className={activeExample === example.id ? "example-option example-option--active" : "example-option"}
                  key={example.id}
                  onClick={() => loadExample(example.id)}
                  role="tab"
                  type="button"
                  aria-selected={activeExample === example.id}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </section>

          <section className="control-panel">
            <div className="panel-heading">
              <p className="eyebrow">Run profile</p>
              <h2>Local evaluation</h2>
            </div>
            <dl className="metric-list">
              <div className="metric-row">
                <dt>Criteria</dt>
                <dd>{criteriaCount}</dd>
              </div>
              <div className="metric-row">
                <dt>Responses</dt>
                <dd>{responseCount}</dd>
              </div>
              <div className="metric-row">
                <dt>Runtime</dt>
                <dd>{resultSummary.runtime}</dd>
              </div>
              <div className="metric-row">
                <dt>EvalKit</dt>
                <dd>{resultSummary.version}</dd>
              </div>
            </dl>
          </section>

          <section className="score-panel">
            <p className="eyebrow">Score</p>
            <strong>{resultSummary.averageScore}</strong>
            <span>{runState === "complete" ? "Last run" : runState === "failed" ? "Run failed" : "Awaiting run"}</span>
          </section>
        </aside>

        <section className="editor-workbench">
          <div className="editor-grid">
            <RubricEditor
              value={rubric}
              onChange={(value) => {
                setRubric(value);
                setActiveExample("custom");
                setRunState("ready");
              }}
              meta={`${criteriaCount} criteria`}
            />
            <ResponsesEditor
              value={responses}
              onChange={(value) => {
                setResponses(value);
                setActiveExample("custom");
                setRunState("ready");
              }}
              meta={`${responseCount} JSONL rows`}
            />
          </div>
          <ResultsView value={result} meta={`${resultSummary.runtime} output`} />
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
