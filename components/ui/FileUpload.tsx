"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  onFiles: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  onFiles,
  accept,
  maxFiles = 5,
  className,
}: FileUploadProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      onFiles(accepted.slice(0, maxFiles));
    },
    [maxFiles, onFiles]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  });
  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-secondary px-6 py-10 text-center transition hover:border-accent-blue",
        isDragActive && "border-accent-blue bg-bg-hover",
        className
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mb-2 h-8 w-8 text-foreground-secondary" />
      <p className="text-sm text-foreground-secondary">
        Drag files here, or click to select
      </p>
    </div>
  );
}
