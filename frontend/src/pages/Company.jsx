import React, { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Save,
  AlertCircle,
  Loader2,
} from "lucide-react";

import PageHeader from "../components/layout/PageHeader.jsx";
import Button from "../components/common/Button.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import {
  getCompany,
  updateCompany,
  onboardCompany,
} from "../api/company.js";
import { ApiError } from "../api/client.js";
import { useCrm } from "../context/CrmContext.jsx";

/*
 * The company profile, backed by the singleton company API.
 *
 * Two states matter here and the backend distinguishes them: a 404
 * means onboarding has never run, so the form creates the record via
 * POST /company/onboarding; otherwise it updates via PATCH /company.
 *
 * The fields below are exactly the ones the backend's Zod schema
 * accepts. Nothing is shown that could not be saved — the previous
 * "business hours" field, for instance, has no column on the server
 * and is gone rather than silently discarded on every save.
 */

const EMPTY_FORM = {
  businessName: "",
  legalName: "",
  industry: "",
  description: "",
  website: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  linkedin: "",
  twitter: "",
  facebook: "",
  instagram: "",
  foundedYear: "",
  employeeCount: "",
};

/* Flattens the API's nested address/socialLinks into flat form fields. */
function toForm(company) {
  if (!company) return EMPTY_FORM;

  return {
    businessName: company.businessName || "",
    legalName: company.legalName || "",
    industry: company.industry || "",
    description: company.description || "",
    website: company.website || "",
    email: company.email || "",
    phone: company.phone || "",
    street: company.address?.street || "",
    city: company.address?.city || "",
    state: company.address?.state || "",
    country: company.address?.country || "",
    postalCode: company.address?.postalCode || "",
    linkedin: company.socialLinks?.linkedin || "",
    twitter: company.socialLinks?.twitter || "",
    facebook: company.socialLinks?.facebook || "",
    instagram: company.socialLinks?.instagram || "",
    foundedYear: company.foundedYear ?? "",
    employeeCount: company.employeeCount ?? "",
  };
}

/* And back again, into the nested shape the API expects. */
function toPayload(form) {
  const payload = {
    businessName: form.businessName.trim(),
    legalName: form.legalName.trim(),
    industry: form.industry.trim(),
    description: form.description.trim(),
    website: form.website.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: {
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      postalCode: form.postalCode.trim(),
    },
    socialLinks: {
      linkedin: form.linkedin.trim(),
      twitter: form.twitter.trim(),
      facebook: form.facebook.trim(),
      instagram: form.instagram.trim(),
    },
  };

  /*
   * Both are optional numbers on the server. An empty input must be
   * omitted, not sent as "" or NaN, either of which fails validation.
   */
  if (String(form.foundedYear).trim() !== "") {
    payload.foundedYear = Number(form.foundedYear);
  }

  if (String(form.employeeCount).trim() !== "") {
    payload.employeeCount = Number(form.employeeCount);
  }

  return payload;
}

const INPUT_BASE =
  "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-300 outline-none transition-colors focus:ring-2";

const inputClass = (hasError) =>
  `${INPUT_BASE} ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-ink-100 focus:border-brass-300 focus:ring-brass-100"
  }`;

const labelClass =
  "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400";

/*
 * Declared at module scope on purpose.
 *
 * A component defined inside Company() would be a NEW component type on
 * every render, so React would unmount and remount this subtree on each
 * keystroke — which drops focus out of the input mid-typing. Keeping the
 * type stable is what makes typing continuous, so do not move this back
 * inside the parent.
 *
 * The error text is passed in rather than read from a closure, which is
 * what lets it live out here.
 */
function Field({ label, icon: Icon, error, children, span }) {
  return (
    <div className={span ? "sm:col-span-2" : undefined}>
      <label className={labelClass}>
        {Icon && <Icon size={12} />}
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function Company() {
  const { pushToast } = useCrm();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  /*
   * Null until we know. True means the company record does not exist
   * yet and this form is an onboarding form.
   */
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const load = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setLoadError(null);

    try {
      const company = await getCompany({ signal });

      setForm(toForm(company));
      setNeedsOnboarding(false);
    } catch (caught) {
      if (caught?.name === "AbortError") {
        return;
      }

      /*
       * A 404 is not a failure — it is the "not onboarded yet" state,
       * and the right response is an empty form, not an error page.
       */
      if (caught instanceof ApiError && caught.status === 404) {
        setForm(EMPTY_FORM);
        setNeedsOnboarding(true);
      } else {
        setLoadError(
          caught instanceof ApiError
            ? caught.message
            : "Could not load the company profile."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setDirty(true);
  }

  async function handleSave(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setFieldErrors({});

    try {
      const payload = toPayload(form);

      const saved = needsOnboarding
        ? await onboardCompany(payload)
        : await updateCompany(payload);

      setForm(toForm(saved));
      setNeedsOnboarding(false);
      setDirty(false);

      pushToast(
        needsOnboarding
          ? "Company profile created"
          : "Company information updated"
      );
    } catch (caught) {
      if (caught instanceof ApiError) {
        /*
         * The backend reports nested paths like "address.city", which
         * map onto this form's flat field names.
         */
        if (caught.fieldErrors) {
          const flattened = {};

          Object.entries(caught.fieldErrors).forEach(([path, message]) => {
            flattened[path.split(".").pop()] = message;
          });

          setFieldErrors(flattened);
        }

        pushToast(caught.message, "error");
      } else {
        pushToast("Could not save the company profile.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <PageHeader title="Company" subtitle="Manage your company profile." />
        <div className="rounded-2xl border border-ink-100 bg-white shadow-soft">
          <LoadingState rows={6} />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="animate-fadeIn">
        <PageHeader title="Company" subtitle="Manage your company profile." />
        <EmptyState
          icon={AlertCircle}
          title="Could not load the company profile"
          description={loadError}
          actionLabel="Try again"
          onAction={() => load()}
        />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Company"
        subtitle={
          needsOnboarding
            ? "Set up your company profile to finish onboarding."
            : "Manage your company profile."
        }
      />

      <form onSubmit={handleSave} className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
            <Building2 size={16} />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-ink-900">
              Company Information
            </h3>
            <p className="text-xs text-ink-400">
              {needsOnboarding
                ? "This company has not been onboarded yet"
                : "Visible to leads through the AI sales agent"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field error={fieldErrors.businessName} label="Business Name">
            <input
              className={inputClass(fieldErrors.businessName)}
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              placeholder="Keystone Realty Group"
            />
          </Field>

          <Field error={fieldErrors.legalName} label="Legal Name">
            <input
              className={inputClass(fieldErrors.legalName)}
              value={form.legalName}
              onChange={(e) => set("legalName", e.target.value)}
              placeholder="Keystone Realty Pvt. Ltd."
            />
          </Field>

          <Field error={fieldErrors.industry} label="Industry">
            <input
              className={inputClass(fieldErrors.industry)}
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
              placeholder="Real Estate"
            />
          </Field>

          <Field error={fieldErrors.website} label="Website" icon={Globe}>
            <input
              className={inputClass(fieldErrors.website)}
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://example.com"
            />
          </Field>

          <Field error={fieldErrors.description} label="Description" span>
            <textarea
              rows={3}
              className={inputClass(fieldErrors.description)}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What your company does, in a sentence or two."
            />
          </Field>

          <Field error={fieldErrors.phone} label="Phone" icon={Phone}>
            <input
              className={inputClass(fieldErrors.phone)}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 80 4567 8900"
            />
          </Field>

          <Field error={fieldErrors.email} label="Email" icon={Mail}>
            <input
              className={inputClass(fieldErrors.email)}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="hello@example.com"
            />
          </Field>

          <Field error={fieldErrors.foundedYear} label="Founded Year">
            <input
              type="number"
              className={inputClass(fieldErrors.foundedYear)}
              value={form.foundedYear}
              onChange={(e) => set("foundedYear", e.target.value)}
              placeholder="2018"
            />
          </Field>

          <Field error={fieldErrors.employeeCount} label="Employees">
            <input
              type="number"
              className={inputClass(fieldErrors.employeeCount)}
              value={form.employeeCount}
              onChange={(e) => set("employeeCount", e.target.value)}
              placeholder="24"
            />
          </Field>
        </div>

        {/* Address */}
        <div className="mt-6 border-t border-ink-50 pt-5">
          <p className={labelClass}>
            <MapPin size={12} /> Address
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field error={fieldErrors.street} label="Street" span>
              <input
                className={inputClass(fieldErrors.street)}
                value={form.street}
                onChange={(e) => set("street", e.target.value)}
                placeholder="4th Floor, Prestige Tech Park"
              />
            </Field>

            <Field error={fieldErrors.city} label="City">
              <input
                className={inputClass(fieldErrors.city)}
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Bengaluru"
              />
            </Field>

            <Field error={fieldErrors.state} label="State">
              <input
                className={inputClass(fieldErrors.state)}
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="Karnataka"
              />
            </Field>

            <Field error={fieldErrors.country} label="Country">
              <input
                className={inputClass(fieldErrors.country)}
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="India"
              />
            </Field>

            <Field error={fieldErrors.postalCode} label="Postal Code">
              <input
                className={inputClass(fieldErrors.postalCode)}
                value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
                placeholder="560103"
              />
            </Field>
          </div>
        </div>

        {/* Social links */}
        <div className="mt-6 border-t border-ink-50 pt-5">
          <p className={labelClass}>Social Links</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {["linkedin", "twitter", "facebook", "instagram"].map((network) => (
              <Field
                key={network}
                error={fieldErrors[network]}
                label={network.charAt(0).toUpperCase() + network.slice(1)}
              >
                <input
                  className={inputClass(fieldErrors[network])}
                  value={form[network]}
                  onChange={(e) => set(network, e.target.value)}
                  placeholder={`https://${network}.com/yourcompany`}
                />
              </Field>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            variant="brass"
            icon={saving ? Loader2 : Save}
            disabled={saving || (!dirty && !needsOnboarding)}
          >
            {saving
              ? "Saving…"
              : needsOnboarding
              ? "Create Company Profile"
              : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
