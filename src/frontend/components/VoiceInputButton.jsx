import { VoiceGlyph } from "./VoiceGlyph";

export function VoiceInputButton({ activeLabel, idleLabel, isListening, onClick, compact = false }) {
  const label = isListening ? activeLabel : idleLabel;
  return (
    <button
      aria-label={label}
      aria-pressed={isListening}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        compact ? "w-11 px-0 sm:w-32 sm:px-4" : "w-32 px-4"
      } ${isListening ? "bg-red-600 hover:bg-red-700 shadow-[0_0_0_4px_rgba(220,38,38,0.14)]" : "bg-blue-600 hover:bg-blue-700"}`}
      onClick={onClick}
      type="button"
    >
      <VoiceGlyph active={isListening} />
      <span className={compact ? "hidden sm:inline" : ""}>{label}</span>
    </button>
  );
}
