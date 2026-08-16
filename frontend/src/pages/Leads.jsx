import React, { useMemo, useState } from "react";
import { Plus, Download } from "lucide-react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import LeadFilters from "../components/leads/LeadFilters.jsx";
import LeadTable from "../components/leads/LeadTable.jsx";
import LeadForm from "../components/leads/LeadForm.jsx";
import AssignmentModal from "../components/leads/AssignmentModal.jsx";
import { useCrm } from "../context/CrmContext.jsx";

const EMPTY_FILTERS = { query: "", status: "ALL", source: "ALL", assignedTo: "ALL" };

export default function Leads() {
  const { leads, pushToast } = useCrm();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [assignLead, setAssignLead] = useState(null);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filters.status !== "ALL" && l.status !== filters.status) return false;
      if (filters.source !== "ALL" && l.source !== filters.source) return false;
      if (filters.assignedTo === "UNASSIGNED" && l.assignedTo) return false;
      if (filters.assignedTo !== "ALL" && filters.assignedTo !== "UNASSIGNED" && l.assignedTo !== filters.assignedTo) return false;
      if (filters.query) {
        const q = filters.query.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !l.phone.includes(q) && !(l.email || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [leads, filters]);

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Leads"
        subtitle="Manage and track your real-estate opportunities."
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={() => pushToast("Export started — leads.csv will download shortly", "info")}>
              Export
            </Button>
            <Button variant="brass" icon={Plus} onClick={() => { setEditLead(null); setFormOpen(true); }}>
              Add Lead
            </Button>
          </>
        }
      />

      <LeadFilters filters={filters} setFilters={setFilters} />

      <p className="mb-3 text-xs font-medium text-ink-400">{filtered.length} of {leads.length} leads</p>

      <LeadTable
        leads={filtered}
        onEdit={(l) => { setEditLead(l); setFormOpen(true); }}
        onAssign={setAssignLead}
        onAddLead={() => { setEditLead(null); setFormOpen(true); }}
      />

      <LeadForm open={formOpen} onClose={() => setFormOpen(false)} existingLead={editLead} />
      <AssignmentModal open={!!assignLead} onClose={() => setAssignLead(null)} lead={assignLead} />
    </div>
  );
}
