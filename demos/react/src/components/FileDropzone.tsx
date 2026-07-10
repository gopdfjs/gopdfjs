import { useId, useRef, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { Icon } from "./Icon";

const PDF_ACCEPT = "application/pdf" as const;

type FileDropzoneProps = {
  accept?: string;
  fileName: string | null;
  hint?: string;
  onPick: (file: File | null) => void;
};

export function FileDropzone({
  accept = PDF_ACCEPT,
  fileName,
  hint = "Drop a PDF here or click to browse",
  onPick,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    onPick(event.target.files?.[0] ?? null);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onPick(event.dataTransfer.files?.[0] ?? null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div
      className={`dropzone${fileName ? " has-file" : ""}`}
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
        className="dropzone-input"
        onChange={onInput}
        tabIndex={-1}
        aria-hidden
      />
      <div className="dropzone-icon">
        <Icon name={fileName ? "file" : "upload"} size={22} />
      </div>
      <div id={`${inputId}-title`} className="dropzone-title">
        {fileName ? "PDF loaded" : "Upload PDF"}
      </div>
      <div className="dropzone-hint">{hint}</div>
      {fileName ? (
        <div className="dropzone-file">
          <Icon name="file" size={14} />
          {fileName}
        </div>
      ) : null}
    </div>
  );
}

export { PDF_ACCEPT };
