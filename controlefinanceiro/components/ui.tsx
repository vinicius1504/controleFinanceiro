"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ─── Marcas de registro "+" dos cantos (classe .blueprint) ─── */
export function Corners({ color }: { color?: string }) {
  const style = color ? { color } : undefined;
  return (
    <>
      <i className="corner tl" style={style} />
      <i className="corner tr" style={style} />
      <i className="corner bl" style={style} />
      <i className="corner br" style={style} />
    </>
  );
}

/* ─── Ícones Lucide (traço 1.5) ─── */
const ICONS: Record<string, React.ReactNode> = {
  dashboard: (<><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></>),
  receipt: (<><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 17.5v-11" /></>),
  trending: (<><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>),
  tag: (<><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" /><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /></>),
  users: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  plus: (<><path d="M5 12h14" /><path d="M12 5v14" /></>),
  x: (<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>),
  menu: (<><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>),
  check: <path d="M20 6 9 17l-5-5" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  arrowRight: (<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>),
  arrowUpRight: (<><path d="M7 7h10v10" /><path d="M7 17 17 7" /></>),
  pencil: (<><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></>),
  trash: (<><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></>),
  eye: (<><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: (<><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" /></>),
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>),
  logout: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></>),
  alert: (<><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></>),
  refresh: (<><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>),
  inbox: (<><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>),
  filterX: (<><path d="M13.013 3H2l8 9.46V19l4 2v-8.54l.9-1.055" /><path d="m22 3-5 5" /><path d="m17 3 5 5" /></>),
  circleCheck: (<><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>),
  arrowDown: (<><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></>),
  arrowUp: (<><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></>),
};

export function Icon({ name, size = 18, strokeWidth = 1.5 }: { name: keyof typeof ICONS | string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block", flex: "none" }}>
      {ICONS[name]}
    </svg>
  );
}

/* ─── Logo "R$" ─── */
export function Logo({ size = 34, onField = false }: { size?: number; onField?: boolean }) {
  return (
    <div
      className="blueprint font-heading"
      style={{
        width: size, height: size, flex: "none", display: "grid", placeItems: "center", fontSize: size * 0.42,
        color: onField ? "var(--color-on-field)" : "var(--color-accent-700)",
        borderColor: onField ? "color-mix(in srgb, var(--color-on-field) 40%, transparent)" : undefined,
      }}
    >
      R$
      <Corners color={onField ? "var(--color-on-field)" : undefined} />
    </div>
  );
}

/* ─── Media query reativa ─── */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
/** Celular / janela estreita (< 900px), igual ao breakpoint do design. */
export const useCompact = () => useMediaQuery("(max-width: 899px)");
/** Largura suficiente para a tabela completa de lançamentos. */
export const useWide = () => useMediaQuery("(min-width: 1200px)");

/* ─── Tema claro/escuro ─── */
function readTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}
export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      window.addEventListener("theme-change", cb);
      return () => window.removeEventListener("theme-change", cb);
    },
    readTheme,
    () => "light" as const
  );
  const setTheme = useCallback((t: "light" | "dark") => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch {}
    window.dispatchEvent(new Event("theme-change"));
  }, []);
  return { theme, setTheme };
}

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const label = theme === "dark" ? "Usar modo claro" : "Usar modo escuro";
  return (
    <button type="button" className="btn btn-ghost btn-icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={label} title={label} style={{ width: 44, height: 44, color: "var(--color-text)" }}>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={20} />
    </button>
  );
}

/* ─── Checkbox no estilo do design ─── */
export function CheckRow({ checked, onChange, children, disabled }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--color-text)", fontSize: 15, minHeight: 32, textAlign: "left" }}
    >
      <span className="check-box" data-on={checked}>{checked && <Icon name="check" size={14} strokeWidth={2} />}</span>
      {children}
    </button>
  );
}

/* ─── Campo de senha com mostrar/ocultar ─── */
export function PasswordInput({ id, value, onChange, placeholder, autoComplete, invalid }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string; invalid?: boolean }) {
  const [show, setShow] = useState(false);
  const label = show ? "Ocultar senha" : "Mostrar senha";
  return (
    <div style={{ position: "relative" }}>
      <input id={id} className="input" type={show ? "text" : "password"} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} style={{ paddingRight: 48 }} />
      <button type="button" className="btn btn-ghost btn-icon" onClick={() => setShow(!show)} aria-label={label} title={label} style={{ position: "absolute", right: 2, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, color: "var(--color-neutral-700)" }}>
        <Icon name={show ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}

export function FieldError({ msg }: { msg?: string }) {
  return msg ? <div className="field-error">{msg}</div> : null;
}

/* ─── Modal / bottom sheet ─── */
export function Modal({ open, onClose, width = 480, dismissOnBackdrop = false, children }: { open: boolean; onClose: () => void; width?: number; dismissOnBackdrop?: boolean; children: React.ReactNode }) {
  const compact = useCompact();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onClick={dismissOnBackdrop ? onClose : undefined}
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "center", alignItems: compact ? "flex-end" : "center", padding: compact ? 0 : 24, background: "var(--color-scrim)" }}
    >
      <div
        className="blueprint" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        style={{ width: compact ? "100%" : `min(${width}px, 100%)`, maxHeight: compact ? "94%" : "calc(100% - 48px)", display: "flex", flexDirection: "column", background: "var(--color-bg)", boxShadow: "var(--shadow-lg)" }}
      >
        <Corners />
        <div style={{ overflowY: "auto", padding: compact ? "20px 16px 24px" : "26px 28px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalHeader({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
      <div>
        <div className="font-heading" style={{ fontSize: 28, lineHeight: 1.1 }}>{title}</div>
        {sub && <div className="muted" style={{ marginTop: 4, fontSize: 15 }}>{sub}</div>}
      </div>
      <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar" style={{ width: 44, height: 44, color: "var(--color-text)" }}>
        <Icon name="x" size={20} />
      </button>
    </div>
  );
}

/* ─── Toasts (com "Desfazer") ─── */
type Toast = { id: number; msg: string; undo?: () => void };
const ToastCtx = createContext<(msg: string, undo?: () => void) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const compact = useCompact();
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((msg: string, undo?: () => void) => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, msg, undo }].slice(-3));
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div aria-live="polite" style={{ position: "fixed", zIndex: 80, left: compact ? 12 : "auto", right: compact ? 12 : 24, bottom: compact ? 12 : 24, display: "flex", flexDirection: "column", alignItems: compact ? "stretch" : "flex-end", gap: 10, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <div key={t.id} role="status" style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 12, padding: "12px 12px 12px 16px", minWidth: "min(300px, 100%)", maxWidth: 440, background: "var(--color-text)", color: "var(--color-bg)", boxShadow: "var(--shadow-lg)", fontSize: 15 }}>
            <Icon name="circleCheck" size={18} />
            <span style={{ flex: 1, minWidth: 0 }}>{t.msg}</span>
            {t.undo && (
              <button type="button" className="font-heading" onClick={() => { t.undo?.(); dismiss(t.id); }} style={{ background: "none", border: 0, padding: "6px 8px", cursor: "pointer", color: "var(--color-accent-300)", fontSize: 16 }}>
                Desfazer
              </button>
            )}
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Fechar aviso" style={{ background: "none", border: 0, padding: 6, cursor: "pointer", color: "inherit", display: "grid", placeItems: "center" }}>
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ─── Diálogo de confirmação ─── */
export function ConfirmDialog({ open, title, body, label, onConfirm, onClose }: { open: boolean; title: string; body: string; label: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} width={440} dismissOnBackdrop>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span style={{ width: 44, height: 44, flex: "none", display: "grid", placeItems: "center", background: "var(--color-neg-bg)", color: "var(--color-neg)" }}>
          <Icon name="trash" size={20} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="font-heading" style={{ fontSize: 26, lineHeight: 1.1 }}>{title}</div>
          <p className="muted" style={{ margin: "8px 0 0", fontSize: 15 }}>{body}</p>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} style={{ minHeight: "var(--ctl-h)", padding: "0 18px", fontSize: 16 }}>Cancelar</button>
        <button type="button" className="btn btn-danger blueprint" onClick={onConfirm} style={{ minHeight: "var(--ctl-h)", padding: "0 22px", fontSize: 16 }}>
          {label}<Corners />
        </button>
      </div>
    </Modal>
  );
}
