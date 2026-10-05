// src/components/ui/index.jsx
//
// Thin React wrappers over the class-based primitives in src/styles/ui.css.
// They only compose classNames — all visuals come from tokens, so every
// component follows light/dark mode automatically.
import React, { useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ThemeContext } from "../../context/ThemeContext";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/* ── Layout ──────────────────────────────────────────────────────────── */
export function Page({ width, className, children, ...rest }) {
  return (
    <div className={cx("ui-page", width && `ui-page--${width}`, className)} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions, center, className }) {
  return (
    <header className={cx("ui-page-header", center && "ui-page-header--center", className)}>
      <div className="ui-page-header__text">
        {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
        {title && <h1 className="ui-h1">{title}</h1>}
        {subtitle && <p className="ui-lead">{subtitle}</p>}
      </div>
      {actions && <div className="ui-page-header__actions">{actions}</div>}
    </header>
  );
}

export function Section({ eyebrow, title, description, tinted, className, children, ...rest }) {
  const hasHead = eyebrow || title || description;
  return (
    <section className={cx("ui-section", tinted && "ui-section--tinted", className)} {...rest}>
      {hasHead && (
        <div className="ui-section__head">
          <div className="ui-section__title">
            {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
            {title && <h2 className="ui-h2">{title}</h2>}
          </div>
          {description && <p>{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── Card ────────────────────────────────────────────────────────────── */
export function Card({ as: Tag = "div", variant, interactive, selected, compact, className, children, ...rest }) {
  return (
    <Tag
      className={cx(
        "ui-card",
        variant && `ui-card--${variant}`,
        interactive && "ui-card--interactive",
        selected && "ui-card--selected",
        compact && "ui-card--compact",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ── Button ──────────────────────────────────────────────────────────── */
export const Button = React.forwardRef(function Button(
  { as: Tag = "button", variant = "secondary", size, pill, block, icon, iconOnly, loading, className, children, type, ...rest },
  ref
) {
  return (
    <Tag
      ref={ref}
      type={Tag === "button" ? type || "button" : type}
      className={cx(
        "ui-btn",
        `ui-btn--${variant}`,
        size && `ui-btn--${size}`,
        pill && "ui-btn--pill",
        block && "ui-btn--block",
        iconOnly && "ui-btn--icon",
        className
      )}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="ui-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : icon}
      {children}
    </Tag>
  );
});

/* ── Badge / chips ───────────────────────────────────────────────────── */
export function Badge({ tone, size, outline, dot, className, children, ...rest }) {
  return (
    <span
      className={cx("ui-badge", tone && `ui-badge--${tone}`, size && `ui-badge--${size}`, outline && "ui-badge--outline", className)}
      {...rest}
    >
      {dot && <span className="ui-badge__dot" />}
      {children}
    </span>
  );
}

export function IndexPill({ n, active }) {
  return <span className={cx("ui-index", active && "ui-index--active")}>{String(n).padStart(2, "0")}</span>;
}

export function IconTile({ tone, size, className, children }) {
  return <span className={cx("ui-icon-tile", tone && `ui-icon-tile--${tone}`, size && `ui-icon-tile--${size}`, className)}>{children}</span>;
}

/* ── Stats ───────────────────────────────────────────────────────────── */
export function Stat({ value, label, delta, card, className }) {
  return (
    <div className={cx("ui-stat", card && "ui-stat--card", className)}>
      <span className="ui-stat__value">{value}</span>
      <span className="ui-stat__label">{label}</span>
      {delta && <span className="ui-stat__delta">{delta}</span>}
    </div>
  );
}

export function StatStrip({ items, className }) {
  return (
    <div className={cx("ui-stat-strip", className)}>
      {items.map((it) => (
        <Stat key={it.label} value={it.value} label={it.label} delta={it.delta} />
      ))}
    </div>
  );
}

/* ── Progress ────────────────────────────────────────────────────────── */
export function ProgressBar({ value = 0, max = 100, size, tone, className, label }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div
      className={cx("ui-progress", size && `ui-progress--${size}`, tone && `ui-progress--${tone}`, className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="ui-progress__bar" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── Forms ───────────────────────────────────────────────────────────── */
export function Field({ label, help, error, htmlFor, className, children }) {
  return (
    <div className={cx("ui-field", className)}>
      {label && <label className="ui-label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="ui-error">{error}</span> : help ? <span className="ui-help">{help}</span> : null}
    </div>
  );
}
export const Input = React.forwardRef(function Input({ className, invalid, ...rest }, ref) {
  return <input ref={ref} className={cx("ui-input", invalid && "is-invalid", className)} {...rest} />;
});
export const Textarea = React.forwardRef(function Textarea({ className, invalid, ...rest }, ref) {
  return <textarea ref={ref} className={cx("ui-textarea", invalid && "is-invalid", className)} {...rest} />;
});
export const Select = React.forwardRef(function Select({ className, invalid, children, ...rest }, ref) {
  return <select ref={ref} className={cx("ui-select", invalid && "is-invalid", className)} {...rest}>{children}</select>;
});

/* ── Tabs (segmented control) ────────────────────────────────────────── */
export function Tabs({ items, value, onChange, variant, className }) {
  return (
    <div className={cx(variant === "line" ? "ui-tabs-line" : "ui-tabs", className)} role="tablist">
      {items.map((it) => {
        const key = typeof it === "string" ? it : it.value;
        const label = typeof it === "string" ? it : it.label;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={value === key}
            className={cx("ui-tab", value === key && "is-active")}
            onClick={() => onChange?.(key)}
          >
            {typeof it === "object" && it.icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Feedback ────────────────────────────────────────────────────────── */
export function Callout({ tone, icon, className, children }) {
  return (
    <div className={cx("ui-callout", tone && `ui-callout--${tone}`, className)}>
      {icon}
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="ui-empty">
      {icon && <IconTile tone="neutral" size="lg">{icon}</IconTile>}
      {title && <p className="ui-empty__title">{title}</p>}
      {children && <p className="ui-small">{children}</p>}
      {action}
    </div>
  );
}

export function Spinner({ size }) {
  return <span className={cx("ui-spinner", size === "lg" && "ui-spinner--lg")} role="status" aria-label="Loading" />;
}

export function Loading({ label = "Loading…" }) {
  return (
    <div className="ui-loading">
      <Spinner size="lg" />
      <span>{label}</span>
    </div>
  );
}

export function Avatar({ src, name = "", size, className }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return (
    <span className={cx("ui-avatar", size && `ui-avatar--${size}`, className)}>
      {src ? <img src={src} alt={name} /> : initials || "?"}
    </span>
  );
}

/* ── Modal ───────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, footer, size, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="ui-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={cx("ui-modal", size && `ui-modal--${size}`)} role="dialog" aria-modal="true">
        {title && (
          <div className="ui-modal__head">
            <h2 className="ui-h3">{title}</h2>
            <Button variant="ghost" size="sm" iconOnly aria-label="Close" onClick={onClose}>✕</Button>
          </div>
        )}
        <div className="ui-modal__body">{children}</div>
        {footer && <div className="ui-modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ── Theme-resolved colours for charts / canvas / SVG attributes ─────── */
// recharts and similar libraries take colours as JS strings; this resolves
// token values for the current theme and re-renders when the theme flips.
export function useThemeTokens(names = DEFAULT_CHART_TOKENS) {
  const { theme } = useContext(ThemeContext) || {};
  const [version, setVersion] = useState(0);
  useEffect(() => {
    // Attribute is set in an effect; read after it has been applied.
    const id = requestAnimationFrame(() => setVersion((v) => v + 1));
    return () => cancelAnimationFrame(id);
  }, [theme]);
  return useMemo(() => {
    const cs = getComputedStyle(document.documentElement);
    const out = {};
    names.forEach((n) => { out[n.replace(/^--/, "")] = cs.getPropertyValue(n).trim(); });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, version, names.join("|")]);
}
const DEFAULT_CHART_TOKENS = [
  "--ui-accent", "--ui-text", "--ui-text-2", "--ui-text-3", "--ui-border", "--ui-surface", "--ui-surface-2",
  "--ui-success", "--ui-danger", "--ui-warning", "--ui-info",
  "--cat-violet", "--cat-teal", "--cat-amber", "--cat-rose", "--cat-sky", "--cat-green",
];
export const CHART_SERIES = ["cat-violet", "cat-teal", "cat-amber", "cat-rose", "cat-sky", "cat-green"];
