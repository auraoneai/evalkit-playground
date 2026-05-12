export type PlaygroundExample = {
  id: string;
  label: string;
  rubric: string;
  responses: string;
};

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function formatJsonl(rows: unknown[]) {
  return rows.map((row) => JSON.stringify(row)).join("\n");
}

export const examples: PlaygroundExample[] = [
  {
    id: "tutorial",
    label: "Tutorial",
    rubric: formatJson({
      version: "auraone-rubric-v1",
      criteria: [{ criterion_id: "quality", label: "Quality", scale: "binary", weight: 1 }],
    }),
    responses: formatJsonl([{ output_id: "tutorial-1", response: "Synthetic tutorial answer.", labels: { quality: 1 } }]),
  },
  {
    id: "multi-turn",
    label: "Multi-turn",
    rubric: formatJson({
      version: "auraone-rubric-v1",
      criteria: [
        { criterion_id: "instruction_following", label: "Instruction following", scale: "likert", weight: 0.6 },
        { criterion_id: "grounding", label: "Grounding", scale: "binary", weight: 0.4 },
      ],
    }),
    responses: formatJsonl([
      {
        output_id: "chat-1",
        turns: [{ role: "user", content: "Summarize the synthetic policy." }],
        response: "Synthetic summary.",
        labels: { instruction_following: 0.8, grounding: 1 },
      },
    ]),
  },
  {
    id: "ordinal",
    label: "Ordinal",
    rubric: formatJson({
      version: "auraone-rubric-v1",
      criteria: [
        {
          criterion_id: "helpfulness",
          label: "Helpfulness",
          scale: "ordinal",
          anchors: ["incorrect", "partial", "complete"],
          weight: 1,
        },
      ],
    }),
    responses: formatJsonl([
      { output_id: "ordinal-1", response: "A complete synthetic answer with clear steps.", labels: { helpfulness: 1 } },
    ]),
  },
];

export const tutorialRubric = examples[0].rubric;
export const tutorialResponses = examples[0].responses;
