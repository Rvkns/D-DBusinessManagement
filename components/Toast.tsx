import React from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  const palette = {
    success: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200',
    error: 'border-red-500/40 bg-red-950/80 text-red-200',
    info: 'border-drow-500/40 bg-drow-950/90 text-drow-100'
  } as const;

  return (
    <div className={`fixed top-4 right-4 z-[200] border rounded-lg px-4 py-3 shadow-2xl ${palette[type]}`}>
      <div className="flex items-start gap-3">
        <p className="text-sm">{message}</p>
        <button onClick={onClose} className="text-xs opacity-80 hover:opacity-100">✕</button>
      </div>
    </div>
  );
}
