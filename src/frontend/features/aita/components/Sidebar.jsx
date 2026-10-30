import { appCopy } from "@/config/app-copy";
import { ActionStatus } from "@/components/ActionStatus";
import { VoiceInputButton } from "@/components/VoiceInputButton";

export function Sidebar({ startedCount, materials, onSelectMaterial, progressPercent, selectedIndex, unit, units, onSelectUnit, isListening, onVoiceInput, voiceStatus }) {
  return (
    <aside className="border-b border-slate-200 bg-white p-4 lg:sticky lg:top-[68px] lg:max-h-[calc(100vh-68px)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <label className="mb-2 block text-xs font-extrabold uppercase text-slate-500" htmlFor="unitSelect">
        {appCopy.unitLabel}
      </label>
      <select
        id="unitSelect"
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
        value={unit.code}
        onChange={event => onSelectUnit(event.target.value)}
      >
        {units.map(item => <option key={item.unit_code} value={item.unit_code}>{item.unit_code} — {item.name}</option>)}
      </select>

      {onVoiceInput ? <div className="mt-5"><VoiceInputButton activeLabel="Stop" idleLabel="Speak" isListening={isListening} onClick={onVoiceInput} /><ActionStatus message={voiceStatus.message} tone={voiceStatus.tone} /></div> : null}

      <section className="my-5 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-label="Learning progress">
        <div className="mb-2 flex justify-between gap-3 text-sm text-slate-600">
          <span>{appCopy.progressLabel}</span>
          <strong className="text-slate-900">
            {startedCount} of {materials.length} started
          </strong>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      <nav className="grid gap-2" aria-label="Learning material">
        {materials.map((material, index) => (
          <button
            className={`grid min-h-14 grid-cols-[30px_1fr] items-center gap-3 rounded-lg border p-3 text-left transition ${
              selectedIndex === index
                ? "border-emerald-700 bg-emerald-50 shadow-[inset_4px_0_0_#047857]"
                : "border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50"
            }`}
            key={material.id}
            onClick={() => onSelectMaterial(index)}
            type="button"
          >
            <span
              className={`grid size-7 place-items-center rounded-full text-sm font-bold ${
                selectedIndex === index ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {material.sequence}
            </span>
            <span className="grid min-w-0 gap-0.5">
              <strong className="truncate text-sm">{material.title}</strong>
              <small className="truncate text-xs text-slate-500">{material.summary}</small>
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
