import { JsonEditor } from "./JsonEditor";

type RubricEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RubricEditor(props: RubricEditorProps) {
  return <JsonEditor label="Rubric" value={props.value} onChange={props.onChange} />;
}
