import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { runEvalkitInBrowser, encodePermalink } from "./pyodide_loader";
import { RubricEditor } from "./components/RubricEditor";
import { ResponsesEditor } from "./components/ResponsesEditor";
import { ResultsView } from "./components/ResultsView";
import { tutorialRubric, tutorialResponses } from "./examples/tutorial";
export default function App() {
  const [rubric,setRubric]=useState(tutorialRubric); const [responses,setResponses]=useState(tutorialResponses); const [result,setResult]=useState("");
  async function run(){ const out=await runEvalkitInBrowser(rubric,responses); setResult(JSON.stringify(out,null,2)); location.hash=encodePermalink(rubric,responses); }
  return <main><h1>EvalKit Playground</h1><RubricEditor value={rubric} onChange={setRubric}/><ResponsesEditor value={responses} onChange={setResponses}/><button onClick={run}>Run</button><ResultsView value={result}/></main>;
}
createRoot(document.getElementById("root")!).render(<App/>);
