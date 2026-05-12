type PyodideRuntime = {
  loadPackage: (name: string) => Promise<void>;
  pyimport: (name: string) => { install: (packages: string | string[]) => Promise<void> };
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: { set: (name: string, value: unknown) => void };
};

export { decodePermalink, encodePermalink } from "./permalink";

declare global {
  interface Window {
    loadPyodide?: (options?: { indexURL?: string }) => Promise<PyodideRuntime>;
    __auraonePyodide?: Promise<PyodideRuntime>;
    __auraoneEvalkitInstalled?: Promise<void>;
  }
}

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      if (window.loadPyodide) resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function getPyodide() {
  if (!window.__auraonePyodide) {
    window.__auraonePyodide = loadScript(`${PYODIDE_BASE}pyodide.js`).then(() => {
      if (!window.loadPyodide) throw new Error("Pyodide loader was not initialized");
      return window.loadPyodide({ indexURL: PYODIDE_BASE });
    });
  }
  return window.__auraonePyodide;
}

async function ensureEvalkit(pyodide: PyodideRuntime) {
  if (!window.__auraoneEvalkitInstalled) {
    window.__auraoneEvalkitInstalled = (async () => {
      await pyodide.loadPackage("micropip");
      const micropip = pyodide.pyimport("micropip");
      await micropip.install("auraone-evalkit");
    })();
  }
  return window.__auraoneEvalkitInstalled;
}

function localScore(rubric: string, responses: string, error?: unknown) {
  const payload = {
    rubric: JSON.parse(rubric),
    responses: responses
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line)),
  };
  return {
    synthetic: true,
    runtime: "local-fallback",
    pyodideError: error instanceof Error ? error.message : undefined,
    score: payload.responses.length > 0 ? 1 : 0,
    criteria: payload.rubric.criteria?.map((c: any) => c.criterion_id) ?? [],
  };
}

export async function runEvalkitInBrowser(rubric: string, responses: string) {
  try {
    const pyodide = await getPyodide();
    await ensureEvalkit(pyodide);
    pyodide.globals.set("auraone_rubric_json", rubric);
    pyodide.globals.set("auraone_responses_jsonl", responses);
    const resultJson = await pyodide.runPythonAsync(`
import json
import auraone_evalkit
from auraone_evalkit.schema.models import RubricCriterion
from auraone_evalkit.scoring.engine import score_outputs

rubric_spec = json.loads(auraone_rubric_json)
responses = [json.loads(line) for line in auraone_responses_jsonl.splitlines() if line.strip()]
criteria = []
for criterion in rubric_spec.get("criteria", []):
    scale = criterion.get("scoring_type") or criterion.get("scale") or "scale_0_1"
    scoring_type = "scale_0_1" if scale in ("likert", "continuous") else ("binary" if scale == "binary" else "ordinal")
    criteria.append(RubricCriterion.from_mapping({
        "criterion_id": criterion["criterion_id"],
        "domain": "browser_playground",
        "task_type": "synthetic_eval",
        "criterion": criterion.get("description") or criterion.get("label") or criterion["criterion_id"],
        "weight": criterion.get("weight", 1),
        "severity": criterion.get("severity", "info"),
        "scoring_type": scoring_type,
        "examples": criterion.get("examples", []),
        "score_levels": criterion.get("score_levels", {}),
    }))

labels = []
for index, response in enumerate(responses, start=1):
    output_id = response.get("output_id") or response.get("response_id") or response.get("item_id") or response.get("id") or f"out-{index}"
    response["output_id"] = output_id
    response_labels = response.get("labels", {})
    for criterion in criteria:
        labels.append({
            "output_id": output_id,
            "criterion_id": criterion.criterion_id,
            "score": response_labels.get(criterion.criterion_id, response.get("score", 1)),
            "label_source": "playground_synthetic",
        })

result = score_outputs(criteria, responses, labels).to_dict()
result["runtime"] = "pyodide"
result["evalkit_version"] = getattr(auraone_evalkit, "__version__", "unknown")
json.dumps(result)
`);
    return JSON.parse(String(resultJson));
  } catch (error) {
    return localScore(rubric, responses, error);
  }
}
