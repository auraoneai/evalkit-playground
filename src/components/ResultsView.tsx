import { JsonEditor } from "./JsonEditor";

type ResultsViewProps = {
  value: string;
};

export function ResultsView(props: ResultsViewProps) {
  return <JsonEditor label="Result" value={props.value || "{}"} readOnly height="220px" />;
}
