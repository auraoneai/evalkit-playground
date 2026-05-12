export async function runEvalkitInBrowser(rubric: string, responses: string) {
  const payload = {
    rubric: JSON.parse(rubric),
    responses: responses
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line)),
  };
  return { synthetic: true, score: 1, criteria: payload.rubric.criteria?.map((c: any) => c.criterion_id) ?? [] };
}
export function encodePermalink(rubric: string, responses: string) { return btoa(unescape(encodeURIComponent(JSON.stringify({ rubric, responses })))); }
export function decodePermalink(hash: string) { return JSON.parse(decodeURIComponent(escape(atob(hash)))); }
