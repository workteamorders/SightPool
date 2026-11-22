import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md border font-medium " +
  "transition-[background-color,border-color,color,transform] duration-[var(--dur-micro)] ease-out " +
  "active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:scale-100 " +
  "aria-disabled:cursor-not-allowed";

export const variants: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent text-on-accent hover:bg-accent-hover hover:border-accent-hover active:bg-accent-press " +
    "disabled:border-line-strong disabled:bg-surface-3 disabled:text-faint",
  secondary:
    "border-line-control bg-surface-2 text-text hover:bg-surface-3 hover:border-muted disabled:border-line disabled:text-faint disabled:bg-surface",
  ghost: "border-transparent bg-transparent text-text hover:bg-surface-2 disabled:text-faint disabled:bg-transparent",
  danger:
    "border-danger-solid bg-danger-solid text-on-danger hover:bg-danger hover:border-danger disabled:border-line-strong disabled:bg-surface-3 disabled:text-faint",
};

export const sizes: Record<ButtonSize, string> = {
  sm: "min-h-touch px-3 text-14",
  md: "min-h-touch px-4 text-16",
  lg: "min-h-12 px-6 text-16",
};


/** Static stand-ins for interactive states, used only by /styleguide so every state is visible at once. */
export type ForcedState = "hover" | "focus" | "pressed";
export const forced: Record<ButtonVariant, Record<ForcedState, string>> = {
  primary: { hover: "bg-accent-hover border-accent-hover", focus: "outline-2 outline-offset-2 outline-focus", pressed: "bg-accent-press translate-y-px scale-[0.99]" },
  secondary: { hover: "bg-surface-3 border-muted", focus: "outline-2 outline-offset-2 outline-focus", pressed: "bg-surface-3 translate-y-px scale-[0.99]" },
  ghost: { hover: "bg-surface-2", focus: "outline-2 outline-offset-2 outline-focus", pressed: "bg-surface-2 translate-y-px scale-[0.99]" },
  danger: { hover: "bg-danger border-danger", focus: "outline-2 outline-offset-2 outline-focus", pressed: "bg-danger translate-y-px scale-[0.99]" },
};

/** A link styled as a button (navigation, not action). Works in server components. */
export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], "no-underline", className);
}
