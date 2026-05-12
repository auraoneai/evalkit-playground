import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { runEvalkitInBrowser, decodePermalink, encodePermalink } from "./pyodide_loader";
import "./App.css";
import { RubricEditor } from "./components/RubricEditor";
import { ResponsesEditor } from "./components/ResponsesEditor";
import { ResultsView } from "./components/ResultsView";
import { examples, tutorialRubric, tutorialResponses } from "./examples/tutorial";

export default function App() {
  const [rubric, setRubric] = useState(tutorialRubric);
  const [responses, setResponses] = useState(tutorialResponses);
  const [result, setResult] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!location.hash) return;
    try {
      const decoded = decodePermalink(location.hash.slice(1));
      if (typeof decoded.rubric === "string") setRubric(decoded.rubric);
      if (typeof decoded.responses === "string") setResponses(decoded.responses);
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
    history.replaceState(null, "", location.pathname);
  }

  async function run() {
    setRunning(true);
    try {
      const out = await runEvalkitInBrowser(rubric, responses);
      setResult(JSON.stringify(out, null, 2));
      location.hash = encodePermalink(rubric, responses);
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="shell">
      <header>
        <h1>EvalKit Playground</h1>
        <div className="toolbar">
          <select aria-label="Load example" onChange={(event) => loadExample(event.target.value)} defaultValue="tutorial">
            {examples.map((example) => (
              <option value={example.id} key={example.id}>
                {example.label}
              </option>
            ))}
          </select>
          <button onClick={run} disabled={running}>
            {running ? "Running" : "Run"}
          </button>
        </div>
      </header>
      <div className="grid">
        <RubricEditor value={rubric} onChange={setRubric} />
        <ResponsesEditor value={responses} onChange={setResponses} />
      </div>
      <ResultsView value={result} />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
