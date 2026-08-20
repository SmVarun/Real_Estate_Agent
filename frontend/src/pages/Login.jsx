import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Mail, Lock, ArrowRight, Building2, TrendingUp, Users } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@keystonerealty.in");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  async function handleSubmit(e) {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Login failed");
      return;
    }

    console.log("Login successful:", result);

    navigate("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    alert("Cannot connect to the backend");
  }
}

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left - brand panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-ink-900 p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-900/80 to-ink-950" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-brass-400">
            <KeyRound size={18} />
          </div>
          <span className="font-display text-lg font-semibold">Keystone</span>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-[34px] font-medium leading-[1.15] text-white">
            Turn every property inquiry into a qualified opportunity.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Keystone's AI sales agent engages every lead the moment they reach out — on WhatsApp, Instagram,
            or your website — and hands your team only the conversations worth having.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
            <div>
              <p className="font-display text-xl font-semibold text-brass-400">1,248</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/50"><Users size={11} /> Leads managed</p>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-brass-400">42%</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/50"><TrendingUp size={11} /> Faster response</p>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-brass-400">18</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/50"><Building2 size={11} /> Deals closed</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">© 2026 Keystone Realty Group. All rights reserved.</p>
      </div>

      {/* Right - form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-brass-400">
              <KeyRound size={18} />
            </div>
            <span className="font-display text-lg font-semibold text-ink-900">Keystone</span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-ink-400">Sign in to manage your sales pipeline.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">Email</label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-ink-100 bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink-800 outline-none transition-colors focus:border-brass-300 focus:ring-2 focus:ring-brass-100"
                  placeholder="you@company.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">Password</label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-ink-100 bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink-800 outline-none transition-colors focus:border-brass-300 focus:ring-2 focus:ring-brass-100"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-ink-500">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-3.5 w-3.5 rounded border-ink-200 text-brass-500 focus:ring-brass-200" />
                Remember me
              </label>
              <button type="button" className="text-xs font-medium text-brass-600 hover:text-brass-700">Forgot password?</button>
            </div>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-ink-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-900"
            >
              Sign In <ArrowRight size={15} />
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-ink-300">
            This is a frontend prototype — sign in with any details to continue.
          </p>
        </div>
      </div>
    </div>
  );
}
