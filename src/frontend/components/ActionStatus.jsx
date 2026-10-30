const toneClasses = {
  info: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-blue-200 bg-blue-50 text-blue-800",
  error: "border-red-200 bg-red-50 text-red-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-600"
};

export function ActionStatus({ message, tone = "neutral" }) {
  return (
    <p className={`mt-2 rounded-lg border px-3 py-2 text-sm font-medium ${toneClasses[tone] || toneClasses.neutral}`}>
      {message}
    </p>
  );
}
