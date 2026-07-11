import { useId, useRef, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { Icon } from "./Icon";

type MultiFileDropzoneProps = {
  accept: string;
  fileNames: readonly string[];
  emptyTitle: string;
  loadedTitle: string;
  hint: string;
  onPickMany: (files: File[]) => void;
  onClear?: () => void;
};

export function MultiFileDropzone({
  accept,
  fileNames,
  emptyTitle,
  loadedTitle,
  hint,
  onPickMany,
  onClear,
}: MultiFileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFiles = fileNames.length > 0;

  const openPicker = () => inputRef.current?.click();

  const ingest = (list: FileList | null | undefined) => {
    const files = list ? Array.from(list) : [];
    if (files.length) onPickMany(files);
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    ingest(event.target.files);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    ingest(event.dataTransfer.files);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div className="stack gap-sm">
      <div
        className={`dropzone${hasFiles ? " has-file" : ""}`}
        role="button"
        tabIndex={0}
        aria-labelledby={`${inputId}-title`}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple
          className="dropzone-input"
          onChange={onInput}
          tabIndex={-1}
          aria-hidden
        />
        <div className="dropzone-icon">
          <Icon name={hasFiles ? "file" : "upload"} size={22} />
        </div>
        <div id={`${inputId}-title`} className="dropzone-title">
          {hasFiles ? loadedTitle : emptyTitle}
        </div>
        <div className="dropzone-hint">{hint}</div>
      </div>

      {hasFiles ? (
        <ul className="file-chip-list" data-testid="file-chip-list">
          {fileNames.map((name) => (
            <li key={name}>
              <Icon name="file" size={14} />
              {name}
            </li>
          ))}
        </ul>
      ) : null}

      {hasFiles && onClear ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
          Clear all
        </button>
      ) : null}
    </div>
  );
}
