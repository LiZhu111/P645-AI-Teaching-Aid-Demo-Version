"use client";

import Link from "next/link";
import { useLearningProgress } from "@/hooks/useLearningProgress";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import { useCourse, CourseStatus } from "@/components/CourseProvider";
import { useHydrated } from "@/hooks/useHydrated";

export function ProfilePage() {
  const { materials, unit } = useCourse();
  const { isReady, user, logOut } = useAuth();
  const hydrated = useHydrated();
  const authReady = hydrated && isReady;
  const { progressPercent, startedCount, startedMaterialIds } = useLearningProgress(unit.code, materials);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <AppHeader activePath="/profile" />
      <CourseStatus /><main className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-10 lg:ml-[248px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-extrabold uppercase tracking-wide text-blue-700">{authReady && user ? "Account" : "Authentication"}</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">{authReady && user ? "Your profile" : "Sign in to Aita"}</h1><p className="mt-3 text-slate-600">{authReady && user ? "Keep track of your learning progress and account details." : "Log in or register to access your profile and course progress."}</p></div>
          {authReady && user ? <button className="rounded-lg border border-red-600 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50" onClick={logOut} type="button">Log out</button> : null}
        </div>

        {!authReady ? <section className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading profile...</section> : null}

        {authReady && !user ? <section className="max-w-xl rounded-lg border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-2xl font-bold">Please log in to view your profile</h2><p className="mt-3 leading-6 text-slate-600">Your course progress and account details are available after you log in or create a learner account.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="rounded-lg bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800" href="/login">Log in</Link><Link className="rounded-lg border border-blue-600 px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50" href="/register">Register</Link></div></section> : null}

        {authReady && user ? <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"><section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center gap-4"><div className="grid size-16 shrink-0 place-items-center rounded-full bg-blue-100 text-2xl font-bold text-blue-800">{getInitials(user.name)}</div><div className="min-w-0"><h2 className="truncate text-xl font-bold">{user.name}</h2><p className="text-sm text-slate-500">{user.role}</p></div></div><dl className="mt-7 grid gap-4 text-sm"><div><dt className="font-bold text-slate-500">Email</dt><dd className="mt-1 [overflow-wrap:anywhere]">{user.email}</dd></div><div><dt className="font-bold text-slate-500">Member since</dt><dd className="mt-1">September 2026</dd></div></dl><Link className="mt-7 inline-block text-sm font-bold text-blue-700 hover:underline" href="/">Back to home</Link></section><section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 sm:p-6"><p className="text-sm font-bold text-slate-500">Course progress</p><h2 className="mt-1 text-xl font-bold">{unit.label}</h2><p className="mt-1 text-sm text-slate-600">{unit.name}</p><div className="mt-6 flex items-end justify-between gap-3"><span className="text-4xl font-bold text-emerald-700">{progressPercent}%</span><span className="text-right text-sm text-slate-500">{startedCount} of {materials.length} topics started</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-700" style={{ width: `${progressPercent}%` }} /></div><div className="mt-6 grid gap-3">{materials.map((material) => { const isStarted = startedMaterialIds.includes(material.id); return <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 text-sm last:border-0" key={material.id}><span className="font-semibold">{material.title}</span><span className={isStarted ? "shrink-0 font-bold text-emerald-700" : "shrink-0 text-slate-400"}>{isStarted ? "Started" : "Not started"}</span></div>; })}</div></section></div> : null}
      </main>
    </div>
  );
}

function getInitials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
