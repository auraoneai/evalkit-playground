# EvalKit Playground Architecture

`evalkit-playground` runs EvalKit scoring fully in the browser. It combines a React interface, Monaco JSON editors, Pyodide, and a no-backend fallback scorer.

## Runtime Flow

1. Load the React app and preloaded synthetic examples.
2. Initialize Pyodide from a public CDN.
3. Install `auraone-evalkit` with `micropip` when available.
4. Adapt browser JSON inputs into EvalKit scorer inputs.
5. Execute `score_outputs` client-side and render the JSON result.
6. Encode rubric and response state into the URL hash for permalinks.

## Design Decisions

- There is no backend, API key, or AuraOne account requirement.
- Monaco is used for structured JSON editing because users need syntax feedback before running a score.
- The fallback scorer keeps the playground usable when PyPI/CDN package loading is unavailable.
- All bundled examples are synthetic tutorial data.
