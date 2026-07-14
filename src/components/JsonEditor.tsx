import Editor from "@monaco-editor/react";

type JsonEditorProps = {
  id: string;
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
  id,
  label,
  subtitle,
  meta,
  value,
  onChange,
  language = "json",
  readOnly = false,
  height = "555px",
}: JsonEditorProps) {
  return (
    <section className="editor-panel" id={id} aria-labelledby={`${id}-title`}>
      <div className="editor-panel__header">
        <div>
          <h2 id={`${id}-title`}>{label}</h2>
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
            automaticLayout: true,
            ariaLabel: `${label} editor`,
            minimap: { enabled: false },
            fontFamily: '"IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace',
            fontSize: 13,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            padding: { top: 14, bottom: 14 },
            readOnly,
            renderLineHighlight: "line",
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
          theme="vs"
        />
      </div>
    </section>
  );
}
