import Editor from "@monaco-editor/react";

type JsonEditorProps = {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  language?: "json" | "jsonl";
  readOnly?: boolean;
  height?: string;
};

export function JsonEditor({ label, value, onChange, language = "json", readOnly = false, height = "280px" }: JsonEditorProps) {
  return (
    <section className="editor-panel">
      <h2>{label}</h2>
      <Editor
        height={height}
        language={language === "jsonl" ? "json" : language}
        value={value}
        onChange={(next) => onChange?.(next ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbersMinChars: 3,
          readOnly,
          scrollBeyondLastLine: false,
          wordWrap: "on",
        }}
        theme="vs-dark"
      />
    </section>
  );
}

