import { JsonEditor } from "./JsonEditor";

type ResultsViewProps = {
  value: string;
  meta?: string;
};

export function ResultsView(props: ResultsViewProps) {
  return (
    <JsonEditor
      label="Run output"
      subtitle="Score payload returned from the in-browser EvalKit runner"
      value={props.value || '{\n  "status": "ready"\n}'}
      readOnly
      height="260px"
      meta={props.meta}
    />
  );
}
