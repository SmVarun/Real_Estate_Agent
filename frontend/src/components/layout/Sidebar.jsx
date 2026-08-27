import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutGrid, Users, UserRound, MessagesSquare, Building2, Settings,
  ChevronsLeft, ChevronsRight, LogOut, KeyRound, Library,
} from "lucide-react";
import Avatar from "../common/Avatar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { roleLabel, isAdmin } from "../../constants/index.js";

/*
 * `adminOnly` mirrors the backend's own guard on those routes — a
 * manager or rep would only get a 403 from every request the page
 * makes, so the entry is not shown to them.
 */
const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/salespeople", label: "Salespeople", icon: UserRound },
  { to: "/chat", label: "AI Assistant", icon: MessagesSquare },
  { to: "/knowledge-base", label: "Knowledge Base", icon: Library, adminOnly: true },
  { to: "/company", label: "Company", icon: Building2, adminOnly: true },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = NAV.filter((item) => !item.adminOnly || isAdmin(user));

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink-950/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`fixed lg:sticky top-0 z-50 flex h-screen flex-col border-r border-ink-100 bg-white transition-all duration-200
        ${collapsed ? "w-[76px]" : "w-[248px]"}
        ${mobileOpen ? "left-0" : "-left-full lg:left-0"}`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-2.5 px-5 py-5 ${collapsed ? "justify-center px-0" : ""}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-brass-400">
            <KeyRound size={18} strokeWidth={2.4} />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-display text-[15px] font-semibold text-ink-900">Keystone</p>
              <p className="text-[10.5px] uppercase tracking-wider text-ink-400">AI Sales CRM</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${isActive ? "bg-ink-800 text-white" : "text-ink-500 hover:bg-ink-50 hover:text-ink-800"}
                ${collapsed ? "justify-center px-0" : ""}`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} strokeWidth={2} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-3 mb-2 hidden items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-ink-400 hover:bg-ink-50 hover:text-ink-700 lg:flex"
        >
          {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
        </button>

        {/* User */}
        <div className={`flex items-center gap-3 border-t border-ink-100 px-4 py-4 ${collapsed ? "justify-center px-0" : ""}`}>
          <Avatar name={user?.name || ""} color="#2A3C60" size={36} />
          {!collapsed && (
            <div className="flex-1 min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-ink-800">{user?.name}</p>
              <p className="truncate text-xs text-ink-400">{roleLabel(user?.role)}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-50 hover:text-red-500"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
