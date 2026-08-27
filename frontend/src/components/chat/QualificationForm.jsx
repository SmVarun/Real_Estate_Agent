import React, { useState } from "react";
import { Sparkles, User, Phone, MapPin, ArrowRight, AlertCircle } from "lucide-react";

import Button from "../common/Button.jsx";

/*
 * The gate in front of the public assistant.
 *
 * Three fields, collected as a structured form rather than by asking
 * the model to interview the visitor — a form cannot hallucinate a
 * phone number, and what it captures goes straight into the CRM.
 *
 * The validation here mirrors the backend's schema, but it is a
 * courtesy to the person typing, not a security boundary: the server
 * validates the same rules again and is the one that decides.
 */

/*
 * Deliberately permissive — matched to the backend's rule, which cares
 * about "could a human dial this" rather than about country format.
 */
const PHONE_CHARACTERS = /^[+()\-.\s\d]+$/;

const validate = ({ name, contact, preferredLocation }) => {
  const errors = {};

  if (!name.trim()) {
    errors.name = "Please enter your name.";
  } else if (name.trim().length < 2) {
    errors.name = "Please enter your full name.";
  }

  const digits = contact.replace(/\D/g, "");

  if (!contact.trim()) {
    errors.contact = "Please enter your phone number.";
  } else if (
    !PHONE_CHARACTERS.test(contact.trim()) ||
    digits.length < 7 ||
    digits.length > 15 ||
    /^(\d)\1+$/.test(digits)
  ) {
    errors.contact = "Please enter a valid phone number.";
  }

  if (!preferredLocation.trim()) {
    errors.preferredLocation = "Please enter your preferred location.";
  }

  return errors;
};

const FIELDS = [
  {
    name: "name",
    label: "Full Name",
    icon: User,
    placeholder: "Rahul Sharma",
    autoComplete: "name",
    type: "text",
    inputMode: "text",
  },
  {
    name: "contact",
    label: "Phone Number",
    icon: Phone,
    placeholder: "+91 98765 43210",
    autoComplete: "tel",
    type: "tel",
    inputMode: "tel",
  },
  {
    name: "preferredLocation",
    label: "Preferred Location",
    icon: MapPin,
    placeholder: "Noida",
    autoComplete: "address-level2",
    type: "text",
    inputMode: "text",
  },
];

const EMPTY = { name: "", contact: "", preferredLocation: "" };

export default function QualificationForm({ onSubmit, submitting, error }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  /*
   * Errors appear on submit, not on every keystroke — telling somebody
   * their phone number is invalid while they are still halfway through
   * typing it is noise, not help. Once a field has been marked, it
   * revalidates as they fix it.
   */
  const [submitted, setSubmitted] = useState(false);

  const setField = (field) => (event) => {
    const next = { ...values, [field]: event.target.value };
    setValues(next);

    if (submitted) {
      setErrors(validate(next));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitted(true);

    const found = validate(values);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      /* Move focus to the first problem so a keyboard user is not lost. */
      document.getElementById(`qualify-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    onSubmit({
      name: values.name.trim(),
      contact: values.contact.trim(),
      preferredLocation: values.preferredLocation.trim(),
    });
  };

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-surface/40 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-800 text-brass-400">
            <Sparkles size={20} />
          </div>
          <h2 className="font-display text-xl font-semibold text-ink-900">
            Welcome 👋
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">
            Before we help you find the right property, tell us a little about
            what you&apos;re looking for.
          </p>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft sm:p-6"
        >
          {/*
            A request that never reached the server, or one the server
            rejected as a whole. Field-level problems are shown on the
            fields themselves.
          */}
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3"
            >
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-sm leading-relaxed text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {FIELDS.map(({ name, label, icon: Icon, ...input }) => {
              const id = `qualify-${name}`;
              const message = errors[name];

              return (
                <div key={name}>
                  <label
                    htmlFor={id}
                    className="mb-1.5 block text-xs font-semibold text-ink-600"
                  >
                    {label}
                  </label>

                  <div className="relative">
                    <Icon
                      size={15}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300"
                    />
                    <input
                      id={id}
                      name={name}
                      value={values[name]}
                      onChange={setField(name)}
                      disabled={submitting}
                      aria-invalid={message ? "true" : "false"}
                      aria-describedby={message ? `${id}-error` : undefined}
                      className={`w-full rounded-lg border py-2.5 pl-10 pr-3.5 text-sm text-ink-700 outline-none transition-colors placeholder:text-ink-300 disabled:bg-ink-50 disabled:opacity-70 ${
                        message
                          ? "border-red-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
                          : "border-ink-100 focus:border-brass-300 focus:ring-2 focus:ring-brass-100"
                      }`}
                      {...input}
                    />
                  </div>

                  {message && (
                    <p
                      id={`${id}-error`}
                      className="mt-1.5 text-xs text-red-500"
                    >
                      {message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/*
            Disabled while the request is in flight — together with the
            guard in handleSubmit, that is what stops an impatient
            double-click becoming two enquiries. The server reuses the
            lead anyway, but not sending the second request is better.
          */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={submitting}
            icon={submitting ? undefined : ArrowRight}
            iconRight
            className="mt-5 w-full"
          >
            {submitting ? "Creating your enquiry…" : "Continue"}
          </Button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-400">
            We&apos;ll use these details to have the right advisor follow up
            with you.
          </p>
        </form>
      </div>
    </div>
  );
}

export { validate };
