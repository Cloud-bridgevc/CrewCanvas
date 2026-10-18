"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-md border border-char-300 px-3 py-1.5 text-xs font-semibold text-char-700 hover:border-char-500 print:hidden">
      Print / PDF
    </button>
  );
}
