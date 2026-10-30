import { VoiceGlyph } from "./VoiceGlyph";

export function AudioToggleButton({ activeLabel, idleLabel, isActive, onToggle }) {
  return (
    <button
      aria-pressed={isActive}
      className={`inline-flex min-h-11 w-32 items-center justify-center gap-3 rounded-lg px-4 text-sm font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
        isActive ? "bg-red-600 hover:bg-red-700" : "bg-emerald-700 hover:bg-emerald-800"
      }`}
      onClick={onToggle}
      type="button"
    >
      <VoiceGlyph active={isActive} />
      {isActive ? activeLabel : idleLabel}
    </button>
  );
}
