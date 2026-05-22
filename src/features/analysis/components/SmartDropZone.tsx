"use client";

import { useState } from "react";

interface SmartDropZoneProps {
  children: React.ReactNode;
  onImageDrop: (file: File) => void;
  onAudioDrop: (file: File) => void;
  onUnknown: (file: File) => void;
}

function hasFiles(event: React.DragEvent<HTMLDivElement>) {
  return Array.from(event.dataTransfer.types).includes("Files");
}

function hasExtension(file: File, extensions: string[]) {
  const lowerName = file.name.toLowerCase();
  return extensions.some((extension) => lowerName.endsWith(extension));
}

export function SmartDropZone({
  children,
  onImageDrop,
  onAudioDrop,
  onUnknown,
}: SmartDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];

    if (!file) {
      return;
    }

    if (file.type.startsWith("image/") || hasExtension(file, [".png", ".jpg", ".jpeg", ".webp", ".gif"])) {
      onImageDrop(file);
      return;
    }

    if (file.type.startsWith("audio/") || hasExtension(file, [".mp3", ".m4a", ".ogg", ".wav", ".webm", ".aac", ".mp4"])) {
      onAudioDrop(file);
      return;
    }

    onUnknown(file);
  }

  return (
    <div
      className={`smart-drop-zone ${isDragging ? "drag-over" : ""}`}
      onDragEnter={(event) => {
        if (hasFiles(event)) {
          event.preventDefault();
          setIsDragging(true);
        }
      }}
      onDragOver={(event) => {
        if (hasFiles(event)) {
          event.preventDefault();
          setIsDragging(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
    >
      {children}
      {isDragging ? (
        <div className="smart-drop-overlay" aria-hidden="true">
          <strong>Drop your screenshot or voice note anywhere</strong>
          <span>ScamShield will route it to the right analyzer.</span>
        </div>
      ) : null}
    </div>
  );
}
