import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileJson,
  Github,
  Import,
  LoaderCircle,
  Play,
  Share2,
} from "lucide-react";
import { runEvalkitInBrowser, decodePermalink, encodePermalink } from "./pyodide_loader";
import "./App.css";
import { RubricEditor } from "./components/RubricEditor";
import { ResponsesEditor } from "./components/ResponsesEditor";
import { ResultsView } from "./components/ResultsView";
import { examples, tutorialRubric, tutorialResponses } from "./examples/tutorial";
import { summarizeResult, validateInputs, type ValidationIssue } from "./workspace";

type RunState = "ready" | "running" | "complete" | "failed";
type EditorTab = "rubric" | "responses";
type ImportTarget = "rubric" | "responses";

const runtimeLabels: Record<RunState, string> = {
  ready: "Ready",
  running: "Running locally",
  complete: "Complete",
  failed: "Action required",
};

export default function App() {
  const [rubric, setRubric] = useState(tutorialRubric);
  const [responses, setResponses] = useState(tutorialResponses);
  const [result, setResult] = useState("");
  const [activeExample, setActiveExample] = useState(examples[0].id);
  const [editorTab, setEditorTab] = useState<EditorTab>("rubric");
  const [runState, setRunState] = useState<RunState>("ready");
  const [shareLabel, setShareLabel] = useState("Share");
  const [importTarget, setImportTarget] = useState<ImportTarget>("rubric");
  const [importLabel, setImportLabel] = useState("No imported files");
  const [systemIssues, setSystemIssues] = useState<ValidationIssue[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rubricTabRef = useRef<HTMLButtonElement>(null);
  const responsesTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!location.hash) return;
    try {
      const decoded = decodePermalink(location.hash.slice(1));
      setRubric(decoded.rubric);
      setResponses(decoded.responses);
      setActiveExample("custom");
      setImportLabel("Loaded from permalink");
    } catch {
      setSystemIssues([
        {
          severity: "error",
          source: "permalink",
          location: "URL hash",
          field: "payload",
          message: "The shared link could not be decoded.",
          fix: "Load an example or replace the URL with a newly shared link.",
        },
      ]);
      setRunState("failed");
      history.replaceState(null, "", location.pathname);
    }
  }, []);

  const inputSummary = useMemo(() => validateInputs(rubric, responses), [rubric, responses]);
  const resultSummary = useMemo(() => summarizeResult(result), [result]);
  const issues = [...systemIssues, ...inputSummary.issues];
  const blockingIssues = issues.filter((item) => item.severity === "error");
  const selectedExampleLabel = examples.find((example) => example.id === activeExample)?.label ?? "Custom";

  function resetRunState() {
    setResult("");
    setRunState("ready");
    setSystemIssues([]);
  }

  function loadExample(exampleId: string) {
    const example = examples.find((item) => item.id === exampleId);
    if (!example) return;
    setRubric(example.rubric);
    setResponses(example.responses);
    setActiveExample(exampleId);
    setImportLabel(`Example: ${example.label}`);
    setSystemIssues([]);
    resetRunState();
    history.replaceState(null, "", location.pathname);
  }

  function updateRubric(value: string) {
    setRubric(value);
    setActiveExample("custom");
    resetRunState();
  }

  function updateResponses(value: string) {
    setResponses(value);
    setActiveExample("custom");
    resetRunState();
  }

  async function run() {
    setSystemIssues([]);
    const currentValidation = validateInputs(rubric, responses);
    if (currentValidation.issues.some((item) => item.severity === "error")) {
      setRunState("failed");
      return;
    }

    setRunState("running");
    try {
      const output = await runEvalkitInBrowser(rubric, responses);
      setResult(JSON.stringify(output, null, 2));
      location.hash = encodePermalink(rubric, responses);
      if (output.pyodideError) {
        setSystemIssues([
          {
            severity: "warning",
            source: "runtime",
            location: "Pyodide",
            field: "package",
            message: `The Pyodide runtime was unavailable, so the local fallback produced this run. ${output.pyodideError}`,
            fix: "Check the network connection and run again to load the published EvalKit package.",
          },
        ]);
      }
      setRunState("complete");
    } catch (error) {
      setResult("");
      setSystemIssues([
        {
          severity: "error",
          source: "runtime",
          location: "browser",
          field: "evaluation",
          message: error instanceof Error ? error.message : String(error),
          fix: "Review the input diagnostics, confirm network access, and run again.",
        },
      ]);
      setRunState("failed");
    }
  }

  async function copyPermalink() {
    const hash = encodePermalink(rubric, responses);
    const url = `${location.origin}${location.pathname}#${hash}`;
    history.replaceState(null, "", `${location.pathname}#${hash}`);
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel("Copied");
    } catch {
      setShareLabel("Link ready");
    }
    window.setTimeout(() => setShareLabel("Share"), 1600);
  }

  function chooseImport(target: ImportTarget) {
    setImportTarget(target);
    fileInputRef.current?.click();
  }

  function moveEditorTab(event: React.KeyboardEvent<HTMLButtonElement>, currentTab: EditorTab) {
    let nextTab: EditorTab | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextTab = currentTab === "rubric" ? "responses" : "rubric";
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextTab = currentTab === "rubric" ? "responses" : "rubric";
    } else if (event.key === "Home") {
      nextTab = "rubric";
    } else if (event.key === "End") {
      nextTab = "responses";
    }
    if (!nextTab) return;
    event.preventDefault();
    setEditorTab(nextTab);
    (nextTab === "rubric" ? rubricTabRef : responsesTabRef).current?.focus();
  }

  async function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    if (importTarget === "rubric") {
      updateRubric(text);
      setEditorTab("rubric");
    } else {
      updateResponses(text);
      setEditorTab("responses");
    }
    setImportLabel(`Imported ${file.name}`);
  }

  const RuntimeIcon = runState === "running" ? LoaderCircle : runState === "complete" ? Check : runState === "failed" ? AlertTriangle : Play;

  return (
    <main className="app-shell">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>

      <header className="topbar">
        <a className="brand-lockup" href="https://www.auraone.ai/open" rel="noreferrer">
          <strong>AuraOne</strong>
          <span>Open</span>
          <span className="brand-divider" aria-hidden="true" />
          <span>EvalKit Playground</span>
        </a>

        <div className="topbar-controls">
          <label className="select-control">
            <span className="sr-only">Example dataset</span>
            <FileJson aria-hidden="true" size={17} />
            <select value={activeExample} onChange={(event) => loadExample(event.target.value)}>
              {examples.map((example) => (
                <option value={example.id} key={example.id}>
                  {example.label}
                </option>
              ))}
              {activeExample === "custom" ? <option value="custom">Custom</option> : null}
            </select>
            <ChevronDown aria-hidden="true" size={15} />
          </label>

          <span className={`runtime-status runtime-status--${runState}`} role="status" aria-live="polite">
            <RuntimeIcon aria-hidden="true" className={runState === "running" ? "spin" : ""} size={16} />
            {runtimeLabels[runState]}
          </span>

          <button className="button button--secondary" type="button" onClick={copyPermalink}>
            {shareLabel === "Copied" ? <Check aria-hidden="true" size={17} /> : <Share2 aria-hidden="true" size={17} />}
            {shareLabel}
          </button>
          <button className="button button--primary" type="button" onClick={run} disabled={runState === "running"}>
            {runState === "running" ? <LoaderCircle aria-hidden="true" className="spin" size={18} /> : <Play aria-hidden="true" size={18} />}
            {runState === "running" ? "Running" : "Run evaluation"}
          </button>
        </div>
      </header>

      <section className="workspace-toolbar" aria-label="Input tools">
        <div>
          <p className="eyebrow">Browser scoring workspace</p>
          <h1>{selectedExampleLabel}</h1>
        </div>
        <div className="import-actions">
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            aria-label={`Choose ${importTarget} file`}
            accept={importTarget === "rubric" ? ".json,application/json" : ".jsonl,.json,application/json"}
            onChange={importFile}
          />
          <span className="import-state" aria-live="polite">
            {importLabel}
          </span>
          <button className="button button--secondary" type="button" onClick={() => chooseImport("rubric")}>
            <Import aria-hidden="true" size={17} />
            Import rubric
          </button>
          <button className="button button--secondary" type="button" onClick={() => chooseImport("responses")}>
            <Import aria-hidden="true" size={17} />
            Import responses
          </button>
        </div>
      </section>

      <section className="workspace" id="workspace" aria-label="EvalKit browser workspace" tabIndex={-1}>
        <section className="input-pane" aria-label="Evaluation inputs">
          <div className="editor-tabs" role="tablist" aria-label="Input editors">
            <button
              ref={rubricTabRef}
              id="rubric-tab"
              role="tab"
              type="button"
              aria-selected={editorTab === "rubric"}
              aria-controls="rubric-editor"
              tabIndex={editorTab === "rubric" ? 0 : -1}
              onClick={() => setEditorTab("rubric")}
              onKeyDown={(event) => moveEditorTab(event, "rubric")}
            >
              Rubric
              <span>{inputSummary.criteriaCount}</span>
            </button>
            <button
              ref={responsesTabRef}
              id="responses-tab"
              role="tab"
              type="button"
              aria-selected={editorTab === "responses"}
              aria-controls="responses-editor"
              tabIndex={editorTab === "responses" ? 0 : -1}
              onClick={() => setEditorTab("responses")}
              onKeyDown={(event) => moveEditorTab(event, "responses")}
            >
              Responses
              <span>{inputSummary.responseCount}</span>
            </button>
          </div>
          <div className={`editor-stack editor-stack--${editorTab}`}>
            <div role="tabpanel" aria-labelledby="rubric-tab" hidden={editorTab !== "rubric"}>
              <RubricEditor value={rubric} onChange={updateRubric} meta={`${inputSummary.criteriaCount} criteria`} />
            </div>
            <div role="tabpanel" aria-labelledby="responses-tab" hidden={editorTab !== "responses"}>
              <ResponsesEditor value={responses} onChange={updateResponses} meta={`${inputSummary.responseCount} JSONL rows`} />
            </div>
          </div>
        </section>

        <ResultsView runState={runState} summary={resultSummary} issues={issues} rawValue={result} />
      </section>

      <footer className="status-footer">
        <span>Local-only browser session. Inputs are not sent to AuraOne.</span>
        <dl>
          <div>
            <dt>Criteria</dt>
            <dd>{inputSummary.criteriaCount}</dd>
          </div>
          <div>
            <dt>Responses</dt>
            <dd>{inputSummary.responseCount}</dd>
          </div>
          <div>
            <dt>Missing labels</dt>
            <dd>{inputSummary.missingLabelCount}</dd>
          </div>
          <div>
            <dt>EvalKit</dt>
            <dd>{resultSummary.version}</dd>
          </div>
          <div>
            <dt>Permalink</dt>
            <dd>{location.hash ? "Current" : "Not saved"}</dd>
          </div>
        </dl>
        <nav aria-label="Open source links">
          <a href="https://github.com/auraoneai/evalkit-playground" rel="noreferrer">
            <Github aria-hidden="true" size={16} />
            Source
          </a>
          <a href="https://auraglass.auraone.ai/playground" rel="noreferrer">
            AuraGlass
          </a>
        </nav>
      </footer>
    </main>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing root element");
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
