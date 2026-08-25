// Shared Tailwind class strings so buttons, inputs, cards, and text styles
// stay consistent across every page/component without a full component
// library. Plain strings (not components) — no rendering behavior lives here.

// Colors/border only, no width or padding — compose with your own sizing
// utilities (e.g. for a fixed-width input in a table row).
export const inputBaseClass =
  "rounded-md border border-zinc-300 bg-white text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export const inputClass = `w-full px-3 py-2 text-sm ${inputBaseClass}`;

export const buttonPrimaryClass =
  "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";

export const buttonPrimarySmallClass =
  "rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200";

export const buttonSecondaryClass =
  "rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900";

export const linkButtonClass =
  "text-xs font-medium underline underline-offset-2 opacity-80 transition hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40";

export const cardClass =
  "rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800";

export const sectionHeadingClass =
  "mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400";

export const mutedTextClass = "text-sm text-zinc-500 dark:text-zinc-400";
export const mutedTextSmallClass = "text-xs text-zinc-500 dark:text-zinc-400";

export const errorTextClass =
  "text-sm font-medium text-red-700 dark:text-red-400";
export const errorTextSmallClass =
  "text-xs font-medium text-red-700 dark:text-red-400";

export const successTextClass =
  "text-sm font-medium text-green-700 dark:text-green-400";
export const successTextSmallClass =
  "text-xs font-medium text-green-700 dark:text-green-400";
