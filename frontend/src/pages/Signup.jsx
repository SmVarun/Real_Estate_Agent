import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  KeyRound, Mail, Lock, ArrowRight, Building2, TrendingUp, Users,
  User, Phone, Eye, EyeOff, Check, X, AtSign, Loader2,
} from "lucide-react";
import { classNames } from "../utils/helpers.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api/client.js";

const EMPTY = {
  fullName: "",
  username: "",
  email: "",
  phone: "",
  companyName: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
};

/*
 * The backend requires a username and constrains it to
 * [a-zA-Z0-9_]{3,30}. Rather than making someone invent one, offer a
 * suggestion derived from their name — they can still edit it, and
 * the field is validated on its own terms below.
 */
function suggestUsername(fullName) {
  const slug = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);

  return slug.length >= 3 ? slug : "";
}

function getPasswordChecks(password) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [formError, setFormError] = useState(null);
  const [usernameEdited, setUsernameEdited] = useState(false);
  const { register } = useAuth();

  const passwordChecks = useMemo(() => getPasswordChecks(form.password), [form.password]);
  const passwordValid = Object.values(passwordChecks).every(Boolean);

  function set(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };

      /*
       * Keep the suggestion in step with the name until the moment
       * they type their own — after that it is theirs.
       */
      if (key === "fullName" && !usernameEdited) {
        next.username = suggestUsername(value);
      }

      return next;
    });

    if (key === "username") {
      setUsernameEdited(true);
    }

    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  }

  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";

    if (!form.username.trim()) e.username = "Username is required";
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username.trim()))
      e.username = "3–30 characters, letters, numbers and underscores only";

    if (!form.email.trim()) e.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";

    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[+]?[\d\s-]{7,15}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";

    if (!form.companyName.trim()) e.companyName = "Company name is required";

    if (!form.password) e.password = "Password is required";
    else if (!passwordValid) e.password = "Password does not meet the requirements below";

    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match";

    if (!form.agreeTerms) e.agreeTerms = "You must agree to the Terms of Service and Privacy Policy";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();

    if (submitting) return;

    setFormError(null);

    if (!validate()) return;

    setSubmitting(true);

    try {
      /*
       * Only the four fields the backend's register schema accepts.
       * Phone and company name are collected by this form but the
       * user model has no field for either, so they are not sent —
       * see the note under the submit button.
       *
       * Role is deliberately not sent: the backend strips it and
       * every new account starts as sales_rep.
       */
      await register({
        name: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      /*
       * Registering signs the account in, so go straight to the app.
       */
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);

        /*
         * "Email is already registered" and "Username is already
         * taken" are 409s with no field attached, so map them onto
         * the field they are about.
         */
        if (error.fieldErrors) {
          setErrors((current) => ({ ...current, ...error.fieldErrors }));
        } else if (error.status === 409) {
          const message = error.message.toLowerCase();

          if (message.includes("username")) {
            setErrors((current) => ({ ...current, username: error.message }));
          } else if (message.includes("email")) {
            setErrors((current) => ({ ...current, email: error.message }));
          }
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputWrapClass = "relative";
  const iconClass = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300";
  const baseInputClass =
    "w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink-800 outline-none transition-colors focus:ring-2";
  function inputClass(hasError) {
    return classNames(
      baseInputClass,
      hasError
        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
        : "border-ink-100 focus:border-brass-300 focus:ring-brass-100"
    );
  }
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400";

  const CheckItem = ({ ok, children }) => (
    <li className={classNames("flex items-center gap-1.5 text-[11px]", ok ? "text-emerald-600" : "text-ink-300")}>
      {ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={2.5} />}
      {children}
    </li>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left - brand panel (matches Login page) */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-ink-900 p-10 text-white lg:flex">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-900/80 to-ink-950" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-brass-400">
            <KeyRound size={18} />
          </div>
          <span className="font-display text-lg font-semibold">Keystone</span>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-[34px] font-medium leading-[1.15] text-white">
            Give your sales team an AI agent that never sleeps.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/60">
            Set up your workspace in minutes and let Keystone's AI sales agent start qualifying
            WhatsApp, Instagram, and website leads for your real-estate business today.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
            <div>
              <p className="font-display text-xl font-semibold text-brass-400">1,248</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/50"><Users size={11} /> Leads managed</p>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-brass-400">42%</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/50"><TrendingUp size={11} /> Faster response</p>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-brass-400">18</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-white/50"><Building2 size={11} /> Deals closed</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/30">© 2026 Keystone Realty Group. All rights reserved.</p>
      </div>

      {/* Right - form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-800 text-brass-400">
              <KeyRound size={18} />
            </div>
            <span className="font-display text-lg font-semibold text-ink-900">Keystone</span>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink-900">Create your account</h2>
          <p className="mt-1.5 text-sm text-ink-400">Set up your real-estate AI sales workspace.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
            {formError && (
              <div role="alert" className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                {formError}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className={labelClass}>Full Name</label>
              <div className={inputWrapClass}>
                <User size={16} className={iconClass} />
                <input
                  id="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  className={inputClass(errors.fullName)}
                  placeholder="Enter your full name"
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                />
              </div>
              {errors.fullName && <p id="fullName-error" className="mt-1.5 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>Email Address</label>
              <div className={inputWrapClass}>
                <Mail size={16} className={iconClass} />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputClass(errors.email)}
                  placeholder="Enter your email address"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && <p id="email-error" className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="username" className={labelClass}>Username</label>
              <div className={inputWrapClass}>
                <AtSign size={16} className={iconClass} />
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => set("username", e.target.value)}
                  className={inputClass(errors.username)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? "username-error" : undefined}
                />
              </div>
              {errors.username && <p id="username-error" className="mt-1.5 text-xs text-red-500">{errors.username}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className={labelClass}>Phone Number</label>
                <div className={inputWrapClass}>
                  <Phone size={16} className={iconClass} />
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className={inputClass(errors.phone)}
                    placeholder="Enter your phone number"
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                  />
                </div>
                {errors.phone && <p id="phone-error" className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="companyName" className={labelClass}>Company Name</label>
                <div className={inputWrapClass}>
                  <Building2 size={16} className={iconClass} />
                  <input
                    id="companyName"
                    type="text"
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                    className={inputClass(errors.companyName)}
                    placeholder="Enter your company name"
                    aria-invalid={!!errors.companyName}
                    aria-describedby={errors.companyName ? "companyName-error" : undefined}
                  />
                </div>
                {errors.companyName && <p id="companyName-error" className="mt-1.5 text-xs text-red-500">{errors.companyName}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <div className={inputWrapClass}>
                <Lock size={16} className={iconClass} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  onFocus={() => setPasswordTouched(true)}
                  className={classNames(inputClass(errors.password), "pr-11")}
                  placeholder="Create a password"
                  aria-invalid={!!errors.password}
                  aria-describedby="password-requirements"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-200 rounded"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}

              {(passwordTouched || form.password) && (
                <ul id="password-requirements" className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  <CheckItem ok={passwordChecks.length}>At least 8 characters</CheckItem>
                  <CheckItem ok={passwordChecks.uppercase}>One uppercase letter</CheckItem>
                  <CheckItem ok={passwordChecks.lowercase}>One lowercase letter</CheckItem>
                  <CheckItem ok={passwordChecks.number}>One number</CheckItem>
                </ul>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClass}>Confirm Password</label>
              <div className={inputWrapClass}>
                <Lock size={16} className={iconClass} />
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  className={classNames(inputClass(errors.confirmPassword), "pr-11")}
                  placeholder="Confirm your password"
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-200 rounded"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && <p id="confirmPassword-error" className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="flex items-start gap-2.5 text-xs text-ink-500">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => set("agreeTerms", e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-ink-200 text-brass-500 focus:ring-brass-200"
                  aria-invalid={!!errors.agreeTerms}
                  aria-describedby={errors.agreeTerms ? "terms-error" : undefined}
                />
                <span>
                  I agree to the{" "}
                  <button type="button" className="font-medium text-brass-600 hover:text-brass-700">Terms of Service</button>
                  {" "}and{" "}
                  <button type="button" className="font-medium text-brass-600 hover:text-brass-700">Privacy Policy</button>
                </span>
              </label>
              {errors.agreeTerms && <p id="terms-error" className="mt-1.5 text-xs text-red-500">{errors.agreeTerms}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-ink-800 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Creating Account…
                </>
              ) : (
                <>Create Account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brass-600 hover:text-brass-700">
              Log in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-ink-300">
            Phone number and company name are collected for your records but are not
            yet stored — the account API does not have fields for them.
          </p>
        </div>
      </div>
    </div>
  );
}
