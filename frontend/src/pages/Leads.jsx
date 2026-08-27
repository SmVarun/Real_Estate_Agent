import React, { useMemo, useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import LeadFilters from "../components/leads/LeadFilters.jsx";
import LeadTable from "../components/leads/LeadTable.jsx";
import LeadForm from "../components/leads/LeadForm.jsx";
import AssignmentModal from "../components/leads/AssignmentModal.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import { useCrm } from "../context/CrmContext.jsx";

const EMPTY_FILTERS = { query: "", status: "ALL", source: "ALL", assignedTo: "ALL" };

export default function Leads() {
  const { leads, loading, errors, refreshLeads } = useCrm();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [assignLead, setAssignLead] = useState(null);

  /*
   * Filtering stays client-side: the context already holds the full
   * list, so narrowing it here is instant and costs no round trip.
   * The backend supports the same filters for when this list grows
   * past one page.
   */
  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.status !== "ALL" && lead.status !== filters.status) return false;
      if (filters.source !== "ALL" && lead.source !== filters.source) return false;
      if (filters.assignedTo === "UNASSIGNED" && lead.assignedTo) return false;
      if (
        filters.assignedTo !== "ALL" &&
        filters.assignedTo !== "UNASSIGNED" &&
        lead.assignedTo !== filters.assignedTo
      )
        return false;

      if (filters.query) {
        const term = filters.query.toLowerCase();

        if (
          !lead.name.toLowerCase().includes(term) &&
          !(lead.phone || "").includes(term) &&
          !(lead.email || "").toLowerCase().includes(term)
        )
          return false;
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
          <Button
            variant="brass"
            icon={Plus}
            onClick={() => {
              setEditLead(null);
              setFormOpen(true);
            }}
          >
            Add Lead
          </Button>
        }
      />

      <LeadFilters filters={filters} setFilters={setFilters} />

      {loading.leads ? (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
          <LoadingState rows={6} />
        </div>
      ) : errors.leads ? (
        <EmptyState
          icon={AlertCircle}
          title="Could not load leads"
          description={errors.leads}
          actionLabel="Try again"
          onAction={() => refreshLeads()}
        />
      ) : (
        <>
          <p className="mb-3 text-xs font-medium text-ink-400">
            {filtered.length} of {leads.length} leads
          </p>

          <LeadTable
            leads={filtered}
            onEdit={(lead) => {
              setEditLead(lead);
              setFormOpen(true);
            }}
            onAssign={setAssignLead}
            onAddLead={() => {
              setEditLead(null);
              setFormOpen(true);
            }}
          />
        </>
      )}

      <LeadForm open={formOpen} onClose={() => setFormOpen(false)} existingLead={editLead} />
      <AssignmentModal
        open={!!assignLead}
        onClose={() => setAssignLead(null)}
        lead={assignLead}
      />
    </div>
  );
}
