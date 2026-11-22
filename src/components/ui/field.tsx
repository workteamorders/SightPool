"use client";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/cn";

const control =
  "w-full min-w-0 rounded-md border border-line-control bg-surface px-3 text-16 text-text placeholder:text-faint " +
  "transition-[border-color,background-color] duration-[var(--dur-micro)] ease-out " +
  "hover:border-muted focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-0 " +
  "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2 disabled:text-faint " +
  "aria-[invalid=true]:border-danger read-only:bg-surface-2";

export interface FieldProps {
  label: string;
  /** Helper text, always visible. */
  hint?: ReactNode;
  /** Specific error message. Shown under the field and announced. */
  error?: string | null;
  /** Shown instead of hint after a successful check. */
  success?: string | null;
  /** Optional element on the right of the label row (e.g. a "Max" button). */
  aside?: ReactNode;
  counter?: { value: number; max: number };
  children: (ids: { id: string; describedBy: string; invalid: boolean }) => ReactNode;
  className?: string;
  optional?: boolean;
}

/** Label always visible, helper below, error replaces nothing: it is added and announced. */
export function Field({ label, hint, error, success, aside, counter, children, className, optional }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint || success ? hintId : null, error ? errId : null].filter(Boolean).join(" ");
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-14 font-medium text-text">
          {label}
          {optional && <span className="font-normal text-muted"> (optional)</span>}
        </label>
        {aside}
      </div>
      {children({ id, describedBy, invalid: Boolean(error) })}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          {error && (
            <p id={errId} role="alert" className="flex items-start gap-2 text-14 text-danger">
              <AlertCircle aria-hidden className="mt-1 size-4 flex-none" />
              <span>{error}</span>
            </p>
          )}
          {success && !error ? (
            <p id={hintId} className="flex items-start gap-2 text-14 text-success">
              <Check aria-hidden className="mt-1 size-4 flex-none" />
              <span>{success}</span>
            </p>
          ) : hint ? (
            <p id={hintId} className="text-14 text-muted">
              {hint}
            </p>
          ) : null}
        </div>
        {counter && (
          <p className={cn("num flex-none text-12", counter.value > counter.max ? "text-danger" : "text-muted")} aria-live="polite">
            {counter.value}/{counter.max}
          </p>
        )}
      </div>
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; mono?: boolean; suffix?: ReactNode }>(function Input(
  { className, invalid, mono, suffix, ...rest },
  ref,
) {
  const input = <input ref={ref} aria-invalid={invalid || undefined} className={cn(control, "min-h-touch", mono && "num", suffix ? "pr-16" : null, className)} {...rest} />;
  if (!suffix) return input;
  return (
    <div className="relative">
      {input}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-14 text-muted">{suffix}</span>
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ className, invalid, ...rest }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined} className={cn(control, "min-h-24 py-3 leading-normal", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(function Select({ className, invalid, children, ...rest }, ref) {
  return (
    <div className="relative">
      <select ref={ref} aria-invalid={invalid || undefined} className={cn(control, "min-h-touch appearance-none pr-12", className)} {...rest}>
        {children}
      </select>
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
});

export function Checkbox({ label, hint, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="relative flex min-h-touch min-w-6 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          aria-describedby={hint ? `${id}-h` : undefined}
          className="peer size-6 cursor-pointer appearance-none rounded-sm border border-line-control bg-surface transition-colors duration-[var(--dur-micro)] checked:border-accent checked:bg-accent hover:border-muted disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-2"
          {...rest}
        />
        <Check aria-hidden strokeWidth={3} className="pointer-events-none absolute size-4 text-on-accent opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="flex flex-col gap-1 pt-3">
        <label htmlFor={id} className="cursor-pointer text-16 leading-snug text-text peer-disabled:cursor-not-allowed">
          {label}
        </label>
        {hint && (
          <span id={`${id}-h`} className="text-14 text-muted">
            {hint}
          </span>
        )}
      </span>
    </div>
  );
}

export function RadioGroup<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  hint,
  disabled,
}: {
  legend: string;
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  hint?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled} aria-describedby={hint ? `${id}-h` : undefined}>
      <legend className="mb-2 text-14 font-medium text-text">{legend}</legend>
      {hint && (
        <p id={`${id}-h`} className="-mt-1 mb-1 text-14 text-muted">
          {hint}
        </p>
      )}
      {options.map((o) => (
        <label
          key={o.value}
          className="flex min-h-touch cursor-pointer items-start gap-3 rounded-md border border-line px-3 py-3 transition-colors duration-[var(--dur-micro)] hover:border-line-control has-[:checked]:border-line-control has-[:checked]:bg-surface-2 has-[:disabled]:cursor-not-allowed has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus"
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="mt-1 size-4 flex-none appearance-none rounded-full border border-line-control bg-surface checked:border-4 checked:border-accent focus-visible:outline-none"
          />
          <span className="flex flex-col">
            <span className="text-16 text-text">{o.label}</span>
            {o.hint && <span className="text-14 text-muted">{o.hint}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** Switch. role="switch" with a visible state word, so the state never depends on color or position alone. */
export function Switch({
  label,
  checked,
  onChange,
  disabled,
  hint,
  lockedReason,
}: {
  label: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  hint?: ReactNode;
  lockedReason?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-16 text-text">
          {label}
        </label>
        {hint && (
          <span id={`${id}-h`} className="text-14 text-muted">
            {hint}
          </span>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${id}-h` : undefined}
        aria-disabled={disabled || undefined}
        title={disabled ? lockedReason : undefined}
        onClick={() => !disabled && onChange?.(!checked)}
        className={cn(
          "group flex min-h-touch flex-none items-center gap-2 rounded-md px-1",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <span className="num w-8 text-right text-12 text-muted">{checked ? "On" : "Off"}</span>
        <span
          className={cn(
            "relative h-6 w-12 rounded-full border transition-colors duration-[var(--dur-element)]",
            checked ? "border-accent bg-accent" : "border-line-control bg-surface-2",
            disabled && "opacity-60",
          )}
        >
          <span
            className={cn(
              "absolute top-1 size-4 rounded-full transition-transform duration-[var(--dur-element)] ease-out",
              checked ? "translate-x-6 bg-on-accent" : "translate-x-1 bg-muted",
            )}
          />
        </span>
      </button>
    </div>
  );
}

export function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-14 font-medium">
          {label}
        </label>
        <output htmlFor={id} className="num text-14 text-muted">
          {format ? format(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-touch w-full cursor-pointer accent-[var(--accent)]"
      />
    </div>
  );
}

export function FileInput({ label, hint, accept, onFile, error }: { label: string; hint?: string; accept?: string; onFile: (f: File | null) => void; error?: string | null }) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          type="file"
          accept={accept}
          aria-describedby={describedBy || undefined}
          aria-invalid={invalid || undefined}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="block w-full cursor-pointer rounded-md border border-dashed border-line-control bg-surface p-3 text-14 text-muted file:mr-4 file:min-h-touch file:cursor-pointer file:rounded-sm file:border file:border-line-control file:bg-surface-2 file:px-3 file:text-14 file:text-text hover:border-muted"
        />
      )}
    </Field>
  );
}
