import Editor from "@monaco-editor/react";

type JsonEditorProps = {
  label: string;
  subtitle?: string;
  meta?: string;
  value: string;
  onChange?: (value: string) => void;
  language?: "json" | "jsonl";
  readOnly?: boolean;
  height?: string;
};

export function JsonEditor({
  label,
  subtitle,
  meta,
  value,
  onChange,
  language = "json",
  readOnly = false,
  height = "280px",
}: JsonEditorProps) {
  return (
    <section className="editor-panel">
      <div className="editor-panel__header">
        <div>
          <h2>{label}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {meta ? <span>{meta}</span> : null}
      </div>
      <div className="editor-frame">
        <Editor
          height={height}
          language={language === "jsonl" ? "json" : language}
          loading={<div className="editor-loading">Loading editor</div>}
          value={value}
          onChange={(next) => onChange?.(next ?? "")}
          options={{
            minimap: { enabled: false },
            fontFamily: "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 13,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            padding: { top: 14, bottom: 14 },
            readOnly,
            renderLineHighlight: "line",
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
          theme="vs-dark"
        />
      </div>
    </section>
  );
}
