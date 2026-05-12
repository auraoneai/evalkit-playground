export function JudgeConfig(props: any) { return <textarea value={props.value ?? ""} onChange={e => props.onChange?.(e.target.value)} />; }
