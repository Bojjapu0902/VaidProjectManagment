import { useCallback, useState } from "react";
import Icon from "./Icon";

export default function FileUpload({ onFilesSelected, multiple = true, accept }) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);

  const handleFiles = useCallback(
    (fileList) => {
      const arr = Array.from(fileList);
      setFiles(arr);
      onFilesSelected?.(arr);
    },
    [onFilesSelected]
  );

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center gap-2 rounded-(--radius-lg) border-2 border-dashed cursor-pointer py-10 px-4 text-center transition-colors"
        style={{
          borderColor: isDragging ? "var(--color-portal-primary)" : "var(--color-border-strong)",
          background: isDragging ? "var(--color-portal-primary-light)" : "var(--color-bg)",
        }}
      >
        <Icon name="upload" size={28} className="text-(--color-text-tertiary)" />
        <p className="text-sm font-semibold text-(--color-text-primary)">
          Drag and drop files here
        </p>
        <p className="text-xs text-(--color-text-secondary)">or click to browse from your device</p>
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, idx) => (
            <li
              key={idx}
              className="flex items-center gap-3 text-sm bg-(--color-bg) rounded-(--radius-md) px-3 py-2"
            >
              <Icon name="file-text" size={16} className="text-(--color-text-secondary)" />
              <span className="flex-1 truncate">{file.name}</span>
              <span className="text-xs text-(--color-text-tertiary)">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
