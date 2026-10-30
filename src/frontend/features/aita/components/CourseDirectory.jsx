import { ReaderPanel } from "./ReaderPanel";

export function CourseDirectory({
  currentIndex,
  material,
  materials,
  progressPercent,
  materialError,
  speechOffset,
  startedCount,
  startedMaterialIds,
  unit,
  visible
}) {
  return (
    <section aria-label="Course progress" className="flex h-[75vh] max-h-[calc(100vh-110px)] min-h-[460px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-108px)] lg:min-h-[560px]">
      <header className="shrink-0 border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-emerald-700">Course progress</p>
        <h2 className="mt-1 text-lg font-bold leading-6 tracking-tight text-slate-900">{unit.name}</h2>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
          <span>{startedCount} of {materials.length} topics started</span><span>{progressPercent}%</span>
        </div>
        <div aria-label={`${progressPercent}% of topics started`} className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto border-b border-slate-200">
        <ol className="divide-y divide-slate-100" aria-label="Course topics">
          {materials.map((item, index) => {
            const isCurrent = index === currentIndex;
            const isStarted = startedMaterialIds.includes(item.id);
            return (
              <li aria-current={isCurrent ? "true" : undefined} className={isCurrent ? "bg-emerald-50/60" : ""} key={item.id}>
                <div className={`flex min-h-11 items-center gap-3 px-4 py-2 text-sm ${isCurrent ? "font-bold text-emerald-900" : "text-slate-600"}`}>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${isCurrent ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span>
                  <span className="min-w-0 flex-1 leading-5">{item.title}</span>
                  <span className="shrink-0 text-[11px] font-medium text-slate-400">{isCurrent ? "Current" : isStarted ? "Started" : ""}</span>
                </div>
                {isCurrent && visible ? (
                  <div className="h-[38vh] min-h-[220px] border-t border-emerald-100 px-4 py-2 sm:px-5">
                    {material ? (
                      <ReaderPanel material={material} placementClassName="flex h-full min-h-0 flex-col border-0 bg-transparent p-0 shadow-none" scrollable showControls={false} showHeading={false} speechOffset={speechOffset} />
                    ) : <p className="py-3 text-sm text-slate-600" role={materialError ? "alert" : "status"}>{materialError || "Loading topic content..."}</p>}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

    </section>
  );
}
