"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { appCopy } from "@/config/app-copy";
import { useAuth } from "@/components/AuthProvider";
import { useHydrated } from "@/hooks/useHydrated";

const navigationItems = [
  { href: "/learn", label: "Read material", icon: "▤" },
  { href: "/profile", label: "My progress", icon: "◷" }
];

function NavigationLinks({ items, activePath, onNavigate }) {
  return items.map((item) => (
    <Link
      aria-current={activePath === item.href ? "page" : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
        activePath === item.href
          ? "bg-emerald-50 font-bold text-emerald-800"
          : "font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
      href={item.href}
      key={item.href}
      onClick={onNavigate}
    >
      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center text-lg">{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  ));
}

export function AppHeader({ activePath }) {
  const pathname = usePathname() || "/";
  const currentPath = activePath || pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const { isReady, user } = useAuth();
  const hydrated = useHydrated();
  const authReady = hydrated && isReady;
  const initials = user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const visibleNavigationItems = authReady && !user
    ? navigationItems.filter((item) => item.href !== "/profile")
    : navigationItems;
  const currentLabel = navigationItems.find((item) => item.href === currentPath)?.label || "Study space";

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-7 lg:flex">
        <Link aria-label="Aita learning space" className="flex items-center gap-3 px-2" href="/learn">
          <span className="grid size-10 place-items-center rounded-lg bg-emerald-700 text-xl font-black text-white">A</span>
          <span>
            <span className="block text-xl font-bold tracking-tight text-slate-900">{appCopy.appName}</span>
            <span className="block text-xs text-slate-500">{appCopy.appSubtitle}</span>
          </span>
        </Link>
        <div className="mx-2 mb-7 mt-10 border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Your course</p>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-800">Workshop Safety Basics</p>
          <p className="mt-1 text-xs text-slate-500">demo course learning space</p>
        </div>
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-slate-500">Study space</p>
        <nav aria-label="Primary navigation" className="grid gap-1">
          <NavigationLinks activePath={currentPath} items={visibleNavigationItems} />
        </nav>
        <div className="mt-auto border-t border-slate-200 pt-4">
          {authReady && user ? (
            <Link aria-label={`Open progress for ${user.name}`} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-100" href="/profile">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{initials}</span>
              <span className="min-w-0 truncate text-sm font-bold text-slate-800">{user.name}</span>
            </Link>
          ) : authReady ? (
            <Link className="flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700" href="/login">Log in</Link>
          ) : null}
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white lg:ml-[248px]">
        <div className="flex min-h-[68px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button aria-controls="mobile-navigation" aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-lg text-slate-700 lg:hidden" onClick={() => setMenuOpen((open) => !open)} type="button">{menuOpen ? "×" : "☰"}</button>
          <Link aria-label="Aita learning space" className="flex items-center gap-2 lg:hidden" href="/learn">
            <span className="grid size-9 place-items-center rounded-lg bg-emerald-700 text-lg font-black text-white">A</span>
            <span className="text-lg font-bold tracking-tight text-slate-900">Aita</span>
          </Link>
          <div className="hidden min-w-0 lg:block">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Your study space</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-800">{currentLabel}</p>
          </div>
          <div className="ml-auto" />
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/30 lg:hidden">
          <button aria-label="Close navigation menu" className="absolute inset-0 size-full cursor-default" onClick={() => setMenuOpen(false)} type="button" />
          <nav aria-label="Mobile navigation" className="relative flex h-full w-[min(84vw,320px)] flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-xl" id="mobile-navigation">
            <div className="mb-8 flex items-center justify-between">
              <Link className="flex items-center gap-3" href="/learn" onClick={() => setMenuOpen(false)}>
                <span className="grid size-10 place-items-center rounded-lg bg-emerald-700 text-xl font-black text-white">A</span>
                <span className="text-xl font-bold text-slate-900">Aita</span>
              </Link>
              <button aria-label="Close navigation menu" className="grid size-10 place-items-center rounded-lg border border-slate-300 bg-white text-xl" onClick={() => setMenuOpen(false)} type="button">×</button>
            </div>
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wide text-slate-500">Study space</p>
            <div className="grid gap-1"><NavigationLinks activePath={currentPath} items={visibleNavigationItems} onNavigate={() => setMenuOpen(false)} /></div>
            <div className="mt-auto border-t border-slate-200 pt-4">
              {authReady && user ? (
                <Link aria-label={`Open progress for ${user.name}`} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-slate-100" href="/profile" onClick={() => setMenuOpen(false)}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{initials}</span>
                  <span className="truncate text-sm font-bold text-slate-800">{user.name}</span>
                </Link>
              ) : authReady ? <Link className="flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700" href="/login" onClick={() => setMenuOpen(false)}>Log in</Link> : null}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
