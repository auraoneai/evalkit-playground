import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { runEvalkitInBrowser, decodePermalink, encodePermalink } from "./pyodide_loader";
import { RubricEditor } from "./components/RubricEditor";
import { ResponsesEditor } from "./components/ResponsesEditor";
import { ResultsView } from "./components/ResultsView";
import { tutorialRubric, tutorialResponses } from "./examples/tutorial";
export default function App() {
  const [rubric,setRubric]=useState(tutorialRubric); const [responses,setResponses]=useState(tutorialResponses); const [result,setResult]=useState("");
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
  async function run(){ const out=await runEvalkitInBrowser(rubric,responses); setResult(JSON.stringify(out,null,2)); location.hash=encodePermalink(rubric,responses); }
  return <main><h1>EvalKit Playground</h1><RubricEditor value={rubric} onChange={setRubric}/><ResponsesEditor value={responses} onChange={setResponses}/><button onClick={run}>Run</button><ResultsView value={result}/></main>;
}
createRoot(document.getElementById("root")!).render(<App/>);
