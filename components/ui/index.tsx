"use client";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, className, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none";

    const variants = {
      primary:   "bg-forest-600 text-white hover:bg-forest-700 active:bg-forest-800 shadow-sm",
      secondary: "bg-stone-100 text-stone-800 hover:bg-stone-200 active:bg-stone-300",
      ghost:     "text-stone-700 hover:bg-stone-100 active:bg-stone-200",
      danger:    "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm",
      outline:   "border border-stone-300 text-stone-700 hover:bg-stone-50 active:bg-stone-100",
    };

    const sizes = {
      xs: "h-7 px-2.5 text-xs rounded-md",
      sm: "h-8 px-3 text-sm rounded-lg",
      md: "h-9 px-4 text-sm rounded-lg",
      lg: "h-11 px-6 text-base rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Spinner size="sm" className="text-current" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode;
  color?: string;
  bg?: string;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, color, bg, className, dot }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-body",
      color, bg, className
    )}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full bg-current")} />}
      {children}
    </span>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-stone-700 font-body">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-9 rounded-lg border bg-white px-3 text-sm text-stone-900 placeholder:text-stone-400 font-body",
              "border-stone-300 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20",
              "disabled:bg-stone-50 disabled:text-stone-500 disabled:cursor-not-allowed",
              "transition-colors duration-150",
              error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20",
              icon && "pl-9",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-600 font-body">{error}</p>}
        {hint && !error && <p className="text-xs text-stone-500 font-body">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-stone-700 font-body">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "w-full h-9 rounded-lg border bg-white px-3 text-sm text-stone-900 font-body",
            "border-stone-300 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20",
            "disabled:bg-stone-50 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer",
            error && "border-rose-400",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p className="text-xs text-rose-600 font-body">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

// ─── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const areaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={areaId} className="text-sm font-medium text-stone-700 font-body">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 font-body",
            "border-stone-300 focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20",
            "disabled:bg-stone-50 disabled:cursor-not-allowed resize-y min-h-[80px] transition-colors duration-150",
            error && "border-rose-400",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600 font-body">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps { children: ReactNode; className?: string; hover?: boolean; onClick?: () => void; }

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-stone-200 shadow-card",
        hover && "transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-stone-200 animate-pulse rounded-lg", className)} />;
}

export function SkeletonCard() {
  return (
    <Card className="p-5">
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-3 w-1/2 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </Card>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const s = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-7 h-7" }[size];
  return (
    <svg className={cn("animate-spin text-forest-600", s, className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="text-stone-300 mb-4">{icon}</div>}
      <h3 className="font-display text-lg text-stone-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-500 font-body max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children, className }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode; className?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-up",
        className
      )}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
            <h2 className="font-display text-xl text-stone-900">{title}</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors p-1 rounded-lg hover:bg-stone-100">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

export function StatCard({ label, value, sub, icon, color = "forest" }: {
  label: string; value: string | number; sub?: string; icon?: ReactNode; color?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500 font-body mb-1">{label}</p>
          <p className="font-display text-3xl text-stone-900">{value}</p>
          {sub && <p className="text-xs text-stone-500 font-body mt-0.5">{sub}</p>}
        </div>
        {icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${color}-50 text-${color}-600`)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
