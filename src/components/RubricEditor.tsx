import { JsonEditor } from "./JsonEditor";

type RubricEditorProps = {
  value: string;
  onChange: (value: string) => void;
  meta?: string;
};

export function RubricEditor(props: RubricEditorProps) {
  return (
    <JsonEditor
      id="rubric-editor"
      label="Rubric"
      subtitle="Criteria, scale, labels, and weights"
      value={props.value}
      onChange={props.onChange}
      meta={props.meta}
    />
  );
}
