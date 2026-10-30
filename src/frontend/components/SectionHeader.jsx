export function SectionHeader({ eyebrow, title, trailing }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <p className="mb-2 text-xs font-extrabold uppercase text-slate-500">{eyebrow}</p>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      {trailing}
    </div>
  );
}
