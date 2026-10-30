"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { appConfig } from "@/config/app-config";
import { appCopy } from "@/config/app-copy";
import { useAuth } from "@/components/AuthProvider";
import { createMockUser, matchesMockCredentials, normalizeEmail, validateRegistration } from "@/lib/auth";

const initialForm = { name: "", email: "", password: "", confirmPassword: "" };

export function AuthPage({ mode = "login" }) {
  const isLogin = mode === "login";
  const router = useRouter();
  const { logIn } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setMessage("");
  }

  function submitForm(event) {
    event.preventDefault();
    const email = normalizeEmail(form.email);
    const storedUser = window.localStorage.getItem(appConfig.storageKeys.registeredUser);

    if (!email || !form.password) {
      setMessage("Please enter your email and password.");
      return;
    }

    if (!isLogin) {
      const registrationError = validateRegistration(form);
      if (registrationError) {
        setMessage(registrationError);
        return;
      }
      const newUser = createMockUser(form);
      window.localStorage.setItem(appConfig.storageKeys.registeredUser, JSON.stringify(newUser));
      logIn(newUser);
      router.push("/profile");
      return;
    }

    const user = storedUser ? JSON.parse(storedUser) : null;
    if (!matchesMockCredentials(user, { email, password: form.password })) {
      setMessage("No matching mock account was found. Register first or check your details.");
      return;
    }
    logIn(user);
    router.push("/");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-5 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
        <Link className="flex items-center gap-3" href="/"><span className="grid size-10 place-items-center rounded-lg bg-emerald-700 text-xl font-black text-white">A</span><span className="text-xl font-bold">{appCopy.appName}</span></Link>
        <div className="mt-8"><p className="text-sm font-extrabold uppercase tracking-wide text-emerald-700">Learner account</p><h1 className="mt-2 text-3xl font-bold">{isLogin ? "Welcome back" : "Create your account"}</h1><p className="mt-2 text-slate-600">{isLogin ? "Continue your learning journey." : "Create a learner account for the demo course course."}</p></div>
        <form className="mt-7 grid gap-4" onSubmit={submitForm}>
          {!isLogin ? <Field label="Full name" name="name" onChange={updateField} placeholder="Your name" type="text" value={form.name} /> : null}
          <Field label="Email" name="email" onChange={updateField} placeholder="you@example.com" type="email" value={form.email} />
          <Field label="Password" name="password" onChange={updateField} placeholder="At least 6 characters" type="password" value={form.password} />
          {!isLogin ? <Field label="Confirm password" name="confirmPassword" onChange={updateField} placeholder="Repeat your password" type="password" value={form.confirmPassword} /> : null}
          {message ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">{message}</p> : null}
          <button className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800" type="submit">{isLogin ? "Log in" : "Create account"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">{isLogin ? "New to Aita?" : "Already have an account?"}{" "}<Link className="font-bold text-blue-700 hover:underline" href={isLogin ? "/register" : "/login"}>{isLogin ? "Register" : "Log in"}</Link></p>
      </section>
    </main>
  );
}

function Field({ label, name, onChange, placeholder, type, value }) {
  return <label className="grid gap-2 text-sm font-bold">{label}<input className="min-h-11 rounded-lg border border-slate-300 px-3 font-normal" name={name} onChange={onChange} placeholder={placeholder} required type={type} value={value} /></label>;
}
