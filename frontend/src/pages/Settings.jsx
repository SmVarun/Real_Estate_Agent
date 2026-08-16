import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Bell, Palette, Globe2, LogOut, Save } from "lucide-react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import Avatar from "../components/common/Avatar.jsx";
import { useCrm } from "../context/CrmContext.jsx";

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-brass-500" : "bg-ink-100"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function Settings() {
  const { pushToast } = useCrm();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "Vikram Shetty", email: "vikram.shetty@keystonecrm.in", phone: "+91 96860 77045" });
  const [notifs, setNotifs] = useState({ newLead: true, highlyInterested: true, weeklyDigest: false, assignment: true });
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("English");

  const inputClass =
    "w-full rounded-lg border border-ink-100 bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition-colors focus:border-brass-300 focus:ring-2 focus:ring-brass-100";
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";
  const sectionClass = "rounded-2xl border border-ink-100 bg-white p-6 shadow-soft";

  return (
    <div className="max-w-3xl animate-fadeIn space-y-6">
      <PageHeader title="Settings" subtitle="Manage your profile, preferences, and account." />

      {/* Profile */}
      <div className={sectionClass}>
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600"><User size={16} /></div>
          <h3 className="font-display text-sm font-semibold text-ink-900">Profile</h3>
        </div>
        <div className="mb-5 flex items-center gap-4">
          <Avatar name={profile.name} size={56} color="#2A3C60" />
          <div>
            <p className="text-sm font-semibold text-ink-800">{profile.name}</p>
            <p className="text-xs text-ink-400">Administrator</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="brass" icon={Save} onClick={() => pushToast("Profile updated")}>Save Changes</Button>
        </div>
      </div>

      {/* Preferences */}
      <div className={sectionClass}>
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600"><Bell size={16} /></div>
          <h3 className="font-display text-sm font-semibold text-ink-900">Notifications</h3>
        </div>
        <div className="divide-y divide-ink-50">
          {[
            { key: "newLead", label: "New lead received", desc: "Get notified when a new lead enters the pipeline" },
            { key: "highlyInterested", label: "Highly interested leads", desc: "Alert when a lead needs urgent attention" },
            { key: "assignment", label: "Lead assignment", desc: "Notify when a lead is assigned to you" },
            { key: "weeklyDigest", label: "Weekly digest", desc: "Summary email every Monday morning" },
          ].map((n) => (
            <div key={n.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink-800">{n.label}</p>
                <p className="text-xs text-ink-400">{n.desc}</p>
              </div>
              <Toggle checked={notifs[n.key]} onChange={(v) => setNotifs((p) => ({ ...p, [n.key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600"><Palette size={16} /></div>
          <h3 className="font-display text-sm font-semibold text-ink-900">Appearance & Language</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Theme</label>
            <select className={inputClass} value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark (coming soon)</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className={labelClass}><Globe2 size={12} className="inline mr-1" />Language</label>
            <select className={inputClass} value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option>English</option>
              <option>Hindi</option>
              <option>Kannada</option>
              <option>Telugu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className={sectionClass}>
        <h3 className="mb-1 font-display text-sm font-semibold text-ink-900">Account</h3>
        <p className="mb-4 text-xs text-ink-400">Signed in as {profile.email}</p>
        <Button variant="danger" icon={LogOut} onClick={() => navigate("/login")}>Log Out</Button>
      </div>
    </div>
  );
}
