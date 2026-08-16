import React, { useState } from "react";
import { Plus } from "lucide-react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import SalespersonTable from "../components/salespeople/SalespersonTable.jsx";
import SalespersonForm from "../components/salespeople/SalespersonForm.jsx";
import { useCrm } from "../context/CrmContext.jsx";

export default function Salespeople() {
  const { salespeople } = useCrm();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Sales Team"
        subtitle="Manage your sales team and monitor lead assignments."
        actions={
          <Button variant="brass" icon={Plus} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Add Salesperson
          </Button>
        }
      />
      <SalespersonTable
        people={salespeople}
        onEdit={(sp) => { setEditing(sp); setFormOpen(true); }}
        onAdd={() => { setEditing(null); setFormOpen(true); }}
      />
      <SalespersonForm open={formOpen} onClose={() => setFormOpen(false)} existing={editing} />
    </div>
  );
}
