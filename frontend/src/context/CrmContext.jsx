import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  initialLeads,
  initialSalespeople,
  initialProperties,
  initialActivity,
  initialConversations,
  aiReplyBank,
  STATUS_LABELS,
} from "../data/mockData.js";
import { uid } from "../utils/helpers.js";

const CrmContext = createContext(null);

export function CrmProvider({ children }) {
  const [leads, setLeads] = useState(initialLeads);
  const [salespeople, setSalespeople] = useState(initialSalespeople);
  const [properties, setProperties] = useState(initialProperties);
  const [activity, setActivity] = useState(initialActivity);
  const [conversations, setConversations] = useState(initialConversations);
  const [notifications, setNotifications] = useState(
    initialActivity.slice(0, 6).map((a) => ({ ...a, read: false }))
  );
  const [toasts, setToasts] = useState([]);
  const [company, setCompany] = useState({
    name: "Keystone Realty Group",
    description:
      "A full-service real-estate brokerage helping families and investors find the right property across South India's fastest-growing cities.",
    phone: "+91 80 4567 8900",
    email: "hello@keystonerealty.in",
    website: "www.keystonerealty.in",
    address: "4th Floor, Prestige Tech Park, Bengaluru, Karnataka 560103",
    hours: "Mon – Sat, 9:30 AM – 7:00 PM",
  });

  const pushToast = useCallback((message, variant = "success") => {
    const id = uid("toast");
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  const pushActivity = useCallback((text, type = "status") => {
    const entry = { id: uid("act"), text, type, timestamp: new Date().toISOString(), minutesAgo: 0 };
    setActivity((a) => [entry, ...a]);
    setNotifications((n) => [{ ...entry, read: false }, ...n].slice(0, 20));
  }, []);

  const addLead = useCallback(
    (lead) => {
      const newLead = {
        id: uid("lead"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
        notes: [],
        activity: [{ id: uid("act"), type: "created", text: "Lead created", timestamp: new Date().toISOString() }],
        ...lead,
      };
      setLeads((prev) => [newLead, ...prev]);
      pushActivity(`New lead added — ${newLead.name}`, "lead");
      pushToast(`${newLead.name} added to leads`);
      return newLead;
    },
    [pushActivity, pushToast]
  );

  const updateLead = useCallback((id, patch) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l))
    );
  }, []);

  const deleteLead = useCallback(
    (id) => {
      setLeads((prev) => {
        const lead = prev.find((l) => l.id === id);
        if (lead) pushToast(`${lead.name} removed`, "info");
        return prev.filter((l) => l.id !== id);
      });
    },
    [pushToast]
  );

  const changeLeadStatus = useCallback(
    (id, status) => {
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const entry = {
            id: uid("act"),
            type: "status",
            text: `Status changed to ${STATUS_LABELS[status]}`,
            timestamp: new Date().toISOString(),
          };
          return { ...l, status, updatedAt: new Date().toISOString(), activity: [entry, ...l.activity] };
        })
      );
      const lead = leads.find((l) => l.id === id);
      if (lead) {
        pushActivity(`${lead.name} moved to ${STATUS_LABELS[status]}`, status === "HIGHLY_INTERESTED" ? "status" : "status");
        pushToast(`Status updated to ${STATUS_LABELS[status]}`);
      }
    },
    [leads, pushActivity, pushToast]
  );

  const assignLead = useCallback(
    (id, salespersonId) => {
      const sp = salespeople.find((s) => s.id === salespersonId);
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const entry = {
            id: uid("act"),
            type: "assign",
            text: sp ? `Assigned to ${sp.name}` : "Unassigned",
            timestamp: new Date().toISOString(),
          };
          return { ...l, assignedTo: salespersonId || null, activity: [entry, ...l.activity] };
        })
      );
      const lead = leads.find((l) => l.id === id);
      if (lead && sp) {
        pushActivity(`${sp.name.split(" ")[0]} assigned a lead — ${lead.name}`, "assign");
        pushToast(`Lead assigned to ${sp.name}`);
      }
    },
    [leads, salespeople, pushActivity, pushToast]
  );

  const addNoteToLead = useCallback(
    (id, text) => {
      const note = { id: uid("note"), author: "You", text, createdAt: new Date().toISOString() };
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                notes: [note, ...l.notes],
                activity: [
                  { id: uid("act"), type: "note", text: "Note added", timestamp: new Date().toISOString() },
                  ...l.activity,
                ],
              }
            : l
        )
      );
      pushToast("Note added");
    },
    [pushToast]
  );

  const addSalesperson = useCallback(
    (person) => {
      const newPerson = {
        id: uid("sp"),
        createdAt: new Date().toISOString().slice(0, 10),
        avatarColor: ["#B08D57", "#3D5079", "#0D9488", "#8B5CF6", "#DC2626", "#2A3C60"][
          Math.floor(Math.random() * 6)
        ],
        ...person,
      };
      setSalespeople((prev) => [newPerson, ...prev]);
      pushActivity(`${newPerson.name} joined the sales team`, "assign");
      pushToast(`${newPerson.name} added to sales team`);
      return newPerson;
    },
    [pushActivity, pushToast]
  );

  const updateSalesperson = useCallback((id, patch) => {
    setSalespeople((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const addProperty = useCallback(
    (property) => {
      const newProperty = { id: uid("pr"), ...property };
      setProperties((prev) => [newProperty, ...prev]);
      pushToast(`${newProperty.name} added to listings`);
      return newProperty;
    },
    [pushToast]
  );

  const updateProperty = useCallback((id, patch) => {
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const deleteProperty = useCallback(
    (id) => {
      setProperties((prev) => prev.filter((p) => p.id !== id));
      pushToast("Property removed", "info");
    },
    [pushToast]
  );

  const sendMessage = useCallback(
    (conversationId, text) => {
      const userMsg = { id: uid("m"), sender: "lead", text, timestamp: new Date().toISOString(), fromAgent: true };
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, userMsg], unread: 0 } : c))
      );
      setTimeout(() => {
        const reply = aiReplyBank[Math.floor(Math.random() * aiReplyBank.length)];
        const aiMsg = { id: uid("m"), sender: "ai", text: reply, timestamp: new Date().toISOString() };
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, messages: [...c.messages, aiMsg] } : c))
        );
      }, 1400);
    },
    []
  );

  const markNotificationsRead = useCallback(() => {
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  }, []);

  const stats = useMemo(() => {
    const byStatus = (s) => leads.filter((l) => l.status === s).length;
    return {
      total: leads.length,
      new: byStatus("NEW"),
      interested: byStatus("INTERESTED"),
      highlyInterested: byStatus("HIGHLY_INTERESTED"),
      qualified: byStatus("QUALIFIED"),
      converted: byStatus("CONVERTED"),
      salespeople: salespeople.filter((s) => s.status === "Active").length,
      unassigned: leads.filter((l) => !l.assignedTo).length,
    };
  }, [leads, salespeople]);

  const value = {
    leads,
    salespeople,
    properties,
    activity,
    conversations,
    notifications,
    toasts,
    company,
    stats,
    setCompany,
    addLead,
    updateLead,
    deleteLead,
    changeLeadStatus,
    assignLead,
    addNoteToLead,
    addSalesperson,
    updateSalesperson,
    addProperty,
    updateProperty,
    deleteProperty,
    sendMessage,
    markNotificationsRead,
    pushToast,
  };

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}
