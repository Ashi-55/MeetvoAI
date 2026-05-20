'use client';

import * as React from 'react';
import { Modal } from './modal';

export interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  urls: string[];
}

export function PreviewModal({ open, onClose, urls }: PreviewModalProps) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (!open) setIndex(0);
  }, [open]);

  if (!open) return null;

  const current = urls[index];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="p-4 flex items-center justify-between border-b border-border bg-black/80">
        <div className="text-white font-semibold">Document preview ({index + 1}/{urls.length})</div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIndex((i) => Math.max(0, i - 1))} className="px-3 py-1 rounded bg-white/10 text-white">Prev</button>
          <button onClick={() => setIndex((i) => Math.min(urls.length - 1, i + 1))} className="px-3 py-1 rounded bg-white/10 text-white">Next</button>
          <button onClick={onClose} className="px-3 py-1 rounded bg-red/600 text-white">Close</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        {current ? (
          // Render image or pdf inline when possible
          current.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            // image
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current} alt={`preview-${index}`} className="max-w-full max-h-full rounded-lg shadow-lg" />
          ) : current.match(/\.(pdf)$/i) ? (
            <iframe src={current} className="w-full h-full" title="pdf-preview" />
          ) : (
            <a href={current} target="_blank" rel="noreferrer" className="text-white underline">Open document in new tab</a>
          )
        ) : (
          <div className="text-white/80">No documents to preview</div>
        )}
      </div>
    </div>
  );
}
