import { Icon } from "./Icon";

type LogPanelProps = {
  lines: string[];
};

/** Parse `[HH:MM:SS] message` lines from smoke log. */
function parseLine(line: string): { time: string; message: string } {
  const match = /^\[(\d{2}:\d{2}:\d{2})\]\s(.*)$/.exec(line);
  if (!match) return { time: "", message: line };
  return { time: match[1], message: match[2] };
}

export function LogPanel({ lines }: LogPanelProps) {
  if (!lines.length) {
    return (
      <div className="log-panel">
        <span className="empty">Waiting for events…</span>
      </div>
    );
  }

  return (
    <div className="log-panel" role="log" aria-live="polite">
      {lines.map((line, index) => {
        const { time, message } = parseLine(line);
        return (
          <span key={`${index}-${line}`} className="log-line">
            {time ? <time>{time}</time> : null}
            {message}
          </span>
        );
      })}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon name="terminal" size={18} />
      </div>
      {message}
    </div>
  );
}
