import { JsonEditor } from "./JsonEditor";

type ResponsesEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ResponsesEditor(props: ResponsesEditorProps) {
  return <JsonEditor label="Responses" language="jsonl" value={props.value} onChange={props.onChange} />;
}
