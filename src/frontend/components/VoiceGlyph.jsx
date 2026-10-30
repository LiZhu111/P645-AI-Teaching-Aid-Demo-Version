export function VoiceGlyph({ active = false }) {
  return <span className="grid size-6 place-items-center" aria-hidden="true">{active ? <WaveGlyph /> : <MicGlyph />}</span>;
}

function MicGlyph() {
  return (
    <span className="relative block h-5 w-4">
      <span className="absolute left-1 top-0 h-3.5 w-2 rounded-full border-2 border-current" />
      <span className="absolute bottom-1 left-0 h-2 w-4 rounded-b-full border-b-2 border-l-2 border-r-2 border-current" />
      <span className="absolute bottom-0 left-[7px] h-1.5 w-0.5 bg-current" />
    </span>
  );
}

function WaveGlyph() {
  return (
    <span className="flex h-5 items-center gap-0.5">
      {[10, 16, 20, 14].map((height, index) => (
        <span
          className="w-1 animate-pulse rounded-full bg-current"
          key={height}
          style={{ height: `${height}px`, animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  );
}
