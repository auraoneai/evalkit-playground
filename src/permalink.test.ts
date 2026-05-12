import assert from "node:assert/strict";
import { decodePermalink, encodePermalink } from "./permalink";
import { examples } from "./examples/tutorial";

for (const example of examples) {
  const encoded = encodePermalink(example.rubric, example.responses);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodePermalink(encoded), {
    rubric: example.rubric,
    responses: example.responses,
  });
}

const unicodeRubric = JSON.stringify({
  version: "auraone-rubric-v1",
  criteria: [{ criterion_id: "quality", label: "Quality ✓", scale: "binary", weight: 1 }],
});
const unicodeResponses = JSON.stringify({
  output_id: "unicode-1",
  response: "Synthetic tutorial answer with emoji 🚀",
  labels: { quality: 1 },
});

assert.deepEqual(decodePermalink(encodePermalink(unicodeRubric, unicodeResponses)), {
  rubric: unicodeRubric,
  responses: unicodeResponses,
});

assert.throws(() => decodePermalink(btoa("{}")));
