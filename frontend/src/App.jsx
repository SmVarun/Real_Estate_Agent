import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppShell from "./components/layout/AppShell.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import PublicOnlyRoute from "./routes/PublicOnlyRoute.jsx";
import AdminRoute from "./routes/AdminRoute.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Leads from "./pages/Leads.jsx";
import LeadDetails from "./pages/LeadDetails.jsx";
import Salespeople from "./pages/Salespeople.jsx";
import SalespersonDetails from "./pages/SalespersonDetails.jsx";
import Chat from "./pages/Chat.jsx";
import PublicChat from "./pages/PublicChat.jsx";
import KnowledgeBase from "./pages/KnowledgeBase.jsx";
import Company from "./pages/Company.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <Routes>
      {/*
        Sends a signed-in visitor to the dashboard and everyone else to
        login, rather than assuming either.
      */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/*
        The public property assistant. Deliberately outside every guard
        in this file — a prospective buyer has no account, and this is
        the one page in the application they are meant to reach.

        It is NOT wrapped in AppShell either: no sidebar, no CRM
        navigation, nothing that belongs to the authenticated product.
        Qualification happens inside the page, and the lead it creates
        is what connects it to the CRM.
      */}
      <Route path="/assistant" element={<PublicChat />} />

      {/* Already signed in? These bounce to the app instead of showing a form. */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      {/*
        One authentication check for the whole CRM — the pages below
        can assume there is a user.
      */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetails />} />
          <Route path="/salespeople" element={<Salespeople />} />
          <Route path="/salespeople/:id" element={<SalespersonDetails />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />

          {/*
            Both of these are admin-only on the backend, so a manager
            or rep gets an explanation here instead of a page full of
            403s.
          */}
          <Route element={<AdminRoute title="Knowledge Base" />}>
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
          </Route>

          <Route element={<AdminRoute title="Company" />}>
            <Route path="/company" element={<Company />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
