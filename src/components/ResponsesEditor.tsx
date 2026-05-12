import { JsonEditor } from "./JsonEditor";

type ResponsesEditorProps = {
  value: string;
  onChange: (value: string) => void;
  meta?: string;
};

export function ResponsesEditor(props: ResponsesEditorProps) {
  return (
    <JsonEditor
      label="Responses"
      subtitle="JSONL outputs with optional synthetic labels"
      language="jsonl"
      value={props.value}
      onChange={props.onChange}
      meta={props.meta}
    />
  );
}
