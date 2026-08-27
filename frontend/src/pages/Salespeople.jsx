import React, { useState } from "react";
import { AlertCircle, Info } from "lucide-react";

import PageHeader from "../components/layout/PageHeader.jsx";
import SalespersonTable from "../components/salespeople/SalespersonTable.jsx";
import SalespersonForm from "../components/salespeople/SalespersonForm.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import { useCrm } from "../context/CrmContext.jsx";

/*
 * The sales team, read from GET /api/v1/users.
 *
 * There is no "add salesperson" action: the backend creates accounts
 * only through registration, and deliberately refuses a client-supplied
 * role so nobody can mint an admin. The page therefore has no Add
 * button — an admin grants access by changing an existing account's
 * role, which the row menu does.
 */
export default function Salespeople() {
  const { salespeople, loading, errors, refreshSalespeople } = useCrm();
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Sales Team"
        subtitle="Everyone with access to the CRM, and the leads they are working."
      />

      {loading.salespeople ? (
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
          <LoadingState rows={5} />
        </div>
      ) : errors.salespeople ? (
        <EmptyState
          icon={AlertCircle}
          title="Could not load the sales team"
          description={errors.salespeople}
          actionLabel="Try again"
          onAction={() => refreshSalespeople()}
        />
      ) : (
        <>
          <SalespersonTable
            people={salespeople}
            onEdit={(person) => {
              setSelected(person);
              setFormOpen(true);
            }}
          />

          {/*
            Says where new members come from, since there is no Add
            button to click.
          */}
          <p className="mt-4 flex items-start gap-1.5 text-xs leading-relaxed text-ink-400">
            <Info size={12} className="mt-0.5 shrink-0" />
            New team members join by creating an account on the sign-up page.
            Every account starts as a Sales Executive; an administrator can
            raise its access level from the row menu.
          </p>
        </>
      )}

      <SalespersonForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        existing={selected}
      />
    </div>
  );
}
