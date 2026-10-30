const variants = {
  primary: "bg-blue-600 text-white focus:ring-blue-500",
  speech: "bg-emerald-700 text-white focus:ring-emerald-600",
  voice: "bg-blue-600 text-white focus:ring-blue-500",
  danger: "bg-red-600 text-white focus:ring-red-500",
  quiet: "border border-slate-300 bg-white text-slate-800 hover:border-blue-500 hover:bg-blue-50 focus:ring-slate-400"
};

export function Button({ children, className = "", variant = "quiet", ...props }) {
  return (
    <button
      className={`min-h-10 rounded-lg px-4 text-sm font-bold transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
