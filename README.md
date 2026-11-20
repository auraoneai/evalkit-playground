# EvalKit Playground

**Free LLM evaluation playground in the browser:** validate rubric JSON, score
JSONL model responses, and inspect criterion-level evidence with no backend,
account, or API key.

[![Try it in the browser](https://img.shields.io/badge/try_it-in_the_browser-2563eb)](https://playground.auraone.ai/) [![Deploy](https://github.com/auraoneai/evalkit-playground/actions/workflows/deploy.yml/badge.svg)](https://github.com/auraoneai/evalkit-playground/actions/workflows/deploy.yml) [![license](https://img.shields.io/github/license/auraoneai/evalkit-playground.svg)](LICENSE)

## Quick Start

Open [playground.auraone.ai](https://playground.auraone.ai/) and load the
included example, or run it from source:

```bash
git clone https://github.com/auraoneai/evalkit-playground.git && cd evalkit-playground
npm ci
npm run dev
```

```text
  VITE v5.4.21  ready in 105 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

EvalKit Playground is a browser-based AI evaluation playground for validating
rubric JSON, scoring JSONL model responses, and inspecting criterion-level
evidence without provisioning an evaluation backend. It is the searchable,
interactive entry point for browser evaluation, LLM rubric scoring, EvalKit
experiments, and local JSONL evaluation.

## What It Does And What It Doesn't Do

It does:

- Validate rubric JSON and imported JSONL responses with actionable input
  errors.
- Score responses in the browser by running `auraone-evalkit` under Pyodide,
  and show criterion-level evidence rather than only an aggregate score.
- Create permalinks that encode the full rubric and response state in the URL
  fragment.

It doesn't:

- Send inputs to an AuraOne backend, or keep accounts or server-side projects.
- Encrypt permalinks. Anyone with the link can decode its contents.
- Work fully offline on first use: it downloads Pyodide from jsDelivr and
  installs `auraone-evalkit` with `micropip`.
- Produce evaluation proof from its synthetic fallback, which runs only when
  Pyodide or package loading fails.
- Ship as an npm library. The supported paths are the hosted app and a source
  checkout.

## Part of the AuraOne LLM evaluation workflow

- [EvalKit Playground](https://auraone.ai/open/evalkit-playground): this app.
- [AuraOne EvalKit](https://auraone.ai/open/evalkit): the offline LLM
  evaluation CLI that the playground runs in the browser.
- [Rubric Studio](https://auraone.ai/open/rubric-studio-open): build and review
  evaluation rubrics.
- Components: [EvalKit GitHub Action](https://github.com/auraoneai/evalkit-action),
  [rubric-spec](https://github.com/auraoneai/rubric-spec),
  [eval-adapter](https://github.com/auraoneai/eval-adapter),
  [datasheet-ci](https://github.com/auraoneai/datasheet-ci).

## Who It Is For

**For:** evaluation engineers, researchers, prompt/application developers, and
reviewers who need to understand a rubric or reproduce a small scoring example
before integrating a runner or CI workflow.

**Differentiator:** rubric validation, response import, scoring evidence, and
shareable state are visible in one browser workspace. No AuraOne account or API
key is required.

## Evaluation Workflow

1. Load the included example or import rubric JSON.
2. Paste or import JSONL response records.
3. Validate structure and inspect actionable input errors.
4. Run the in-browser scoring path.
5. Review exact criterion evidence instead of only an aggregate score.
6. Create a permalink when the input is safe to disclose.

Use the hosted browser surface at
[playground.auraone.ai](https://playground.auraone.ai/).

## Run From Source

The supported source path is the public GitHub repository:

```bash
git clone https://github.com/auraoneai/evalkit-playground.git
cd evalkit-playground
npm ci
npm run dev
```

Vite prints the local URL. Node.js 20 or newer is the documented toolchain.
There is no supported npm-library install for the application package.

## Runtime, Data, And Network Boundary

- Rubric and response inputs are processed in browser memory. The playground
  has no AuraOne application backend, account session, or server-side project
  store.
- Permalinks base64url-encode the full rubric and response state in the URL
  fragment. A fragment is not encryption. Anyone receiving the link can decode
  its contents, and browser history, clipboard history, screenshots, or chat
  logs may retain it.
- Do not paste real customer data, secrets, regulated records, or confidential
  evaluation inputs into the hosted playground or a permalink.
- The primary execution path downloads Pyodide `0.26.4` from jsDelivr and asks
  `micropip` to install `auraone-evalkit`. First use therefore requires those
  public network resources unless they are already cached.
- If Pyodide or package loading fails, the UI uses a clearly warned synthetic
  local fallback so the workspace remains demonstrable. That fallback is not a
  substitute for EvalKit execution and must not be treated as evaluation proof.
- Normal product and repository links can navigate away from the app, but input
  data is not posted to an AuraOne backend by the playground.

## Font Boundary

The public source and build contain no private licensed font binary and no
remote font import. Named UI and monospace families resolve through installed
system fallbacks. An authorized branded host may supply licensed typography
only from a host-owned stylesheet on an approved same-origin path; if it is
absent or blocked, the public fallback remains the supported rendering. Private
font files must not be added to source archives, npm packages, or deployment
bundles.

## Proof

```bash
npx playwright install chromium
npm run test:unit
npm run test:ui
npm run build
```

The unit suite covers permalink round trips, validation, imports, and workspace
scoring state. The Chromium suite covers local evaluation evidence, keyboard
navigation, axe accessibility, reduced motion, forced colors, long content,
and responsive layouts from 320 px through 1440 px.

## Release Truth

Status verified on **July 13, 2026**:

- The latest public GitHub release is `v0.1.1`.
- The hosted browser surface is publicly reachable.
- This checkout identifies itself as `0.2.0`; it is a source candidate, not a
  published `0.2.0` release.
- `evalkit-playground` is not published on the public npm registry. The
  supported paths are the hosted app and the GitHub source checkout.

## Next Action

Start with the included non-sensitive example, confirm the evidence rows, and
then use the source tests when integrating. Release owners should tag and
publish `0.2.0` only after the deployed build, source commit, and public release
record all resolve to the same verified version.

---

Need expert reviewers to calibrate or score this evaluation? [Talk to AuraOne](https://auraone.ai/contact?from=open:evalkit-playground)
