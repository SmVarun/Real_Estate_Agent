import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Bell, Palette, LogOut, Info, ShieldCheck } from "lucide-react";

import PageHeader from "../components/layout/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import Avatar from "../components/common/Avatar.jsx";
import Badge from "../components/common/Badge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { roleLabel } from "../constants/index.js";
import { formatDate } from "../utils/helpers.js";

/*
 * Settings.
 *
 * The only thing on this page the backend can currently do is sign
 * out. There is no endpoint to update a profile, and no notification
 * or appearance preferences are stored anywhere.
 *
 * So the profile is shown read-only and the preference sections say
 * they are not available yet, rather than offering inputs and a Save
 * button that would appear to work and persist nothing. The sections
 * are kept because the intent is real — only the false promise is gone.
 */

function UnavailableSection({ icon: Icon, title, description, children }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
          <Icon size={16} />
        </div>
        <h3 className="font-display text-sm font-semibold text-ink-900">{title}</h3>
        <Badge tone="neutral" className="ml-auto">
          Not available yet
        </Badge>
      </div>

      <p className="mb-4 flex items-start gap-1.5 text-xs leading-relaxed text-ink-400">
        <Info size={12} className="mt-0.5 shrink-0" />
        {description}
      </p>

      {/* The intended options, shown disabled so nothing looks saveable. */}
      <div className="pointer-events-none select-none opacity-50">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const readOnlyInput =
    "w-full cursor-not-allowed rounded-lg border border-ink-100 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-500 outline-none";
  const labelClass =
    "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";
  const sectionClass = "rounded-2xl border border-ink-100 bg-white p-6 shadow-soft";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="max-w-3xl animate-fadeIn space-y-6">
      <PageHeader title="Settings" subtitle="Your profile and account." />

      {/* Profile — real data from /users/me */}
      <div className={sectionClass}>
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
            <User size={16} />
          </div>
          <h3 className="font-display text-sm font-semibold text-ink-900">Profile</h3>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <Avatar name={user?.name || ""} size={56} color="#2A3C60" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-800">{user?.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-ink-400">
              <ShieldCheck size={11} />
              {roleLabel(user?.role)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Name</label>
            <input className={readOnlyInput} value={user?.name || ""} readOnly disabled />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={readOnlyInput} value={user?.email || ""} readOnly disabled />
          </div>
          <div>
            <label className={labelClass}>Username</label>
            <input className={readOnlyInput} value={user?.username || ""} readOnly disabled />
          </div>
          <div>
            <label className={labelClass}>Member Since</label>
            <input
              className={readOnlyInput}
              value={user?.createdAt ? formatDate(user.createdAt) : "—"}
              readOnly
              disabled
            />
          </div>
        </div>

        {/*
          No Save button: there is no endpoint behind it. Saying why is
          more useful than a control that silently does nothing.
        */}
        <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-ink-400">
          <Info size={12} className="mt-0.5 shrink-0" />
          Profile details are read-only. The API has no endpoint for editing
          your own profile yet — only an administrator changing an account's
          access level is supported.
        </p>
      </div>

      <UnavailableSection
        icon={Bell}
        title="Notifications"
        description="Notification preferences are not stored anywhere yet. Toggling these would not survive a refresh, so they are disabled until the API supports them."
      >
        <div className="divide-y divide-ink-50">
          {[
            {
              label: "New lead received",
              desc: "Get notified when a new lead enters the pipeline",
            },
            {
              label: "Highly interested leads",
              desc: "Alert when a lead needs urgent attention",
            },
            {
              label: "Lead assignment",
              desc: "Notify when a lead is assigned to you",
            },
            {
              label: "Weekly digest",
              desc: "Summary email every Monday morning",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-ink-800">{item.label}</p>
                <p className="text-xs text-ink-400">{item.desc}</p>
              </div>
              <span className="relative h-6 w-11 shrink-0 rounded-full bg-ink-100">
                <span className="absolute top-0.5 h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-soft" />
              </span>
            </div>
          ))}
        </div>
      </UnavailableSection>

      <UnavailableSection
        icon={Palette}
        title="Appearance & Language"
        description="The application currently ships a single light theme in English. There is no preference store, so these choices cannot be saved."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Theme</label>
            <input className={readOnlyInput} value="Light" readOnly disabled />
          </div>
          <div>
            <label className={labelClass}>Language</label>
            <input className={readOnlyInput} value="English" readOnly disabled />
          </div>
        </div>
      </UnavailableSection>

      {/* Account — logout is real */}
      <div className={sectionClass}>
        <h3 className="mb-1 font-display text-sm font-semibold text-ink-900">Account</h3>
        <p className="mb-4 text-xs text-ink-400">Signed in as {user?.email}</p>
        <Button variant="danger" icon={LogOut} onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </div>
  );
}
