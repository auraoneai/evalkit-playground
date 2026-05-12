type PyodideRuntime = {
  loadPackage: (name: string) => Promise<void>;
  pyimport: (name: string) => { install: (packages: string | string[]) => Promise<void> };
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: { set: (name: string, value: unknown) => void };
};

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
    return await pyodide.runPythonAsync(`
import json
import auraone_evalkit

rubric = json.loads(auraone_rubric_json)
responses = [json.loads(line) for line in auraone_responses_jsonl.splitlines() if line.strip()]
{
    "synthetic": True,
    "runtime": "pyodide",
    "evalkit_version": getattr(auraone_evalkit, "__version__", "unknown"),
    "score": 1 if responses else 0,
    "criteria": [criterion.get("criterion_id") for criterion in rubric.get("criteria", [])],
    "response_count": len(responses),
}
`);
  } catch (error) {
    return localScore(rubric, responses, error);
  }
}
export function encodePermalink(rubric: string, responses: string) { return btoa(unescape(encodeURIComponent(JSON.stringify({ rubric, responses })))); }
export function decodePermalink(hash: string) { return JSON.parse(decodeURIComponent(escape(atob(hash)))); }
