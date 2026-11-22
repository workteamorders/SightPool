"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { base, forced, sizes, variants, type ButtonSize, type ButtonVariant, type ForcedState } from "./button-styles";
export { buttonClass, type ButtonSize, type ButtonVariant } from "./button-styles";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Text read to screen readers while loading. */
  loadingLabel?: string;
  icon?: ReactNode;
  /** Styleguide only. */
  forceState?: ForcedState;
}

/**
 * One button. Loading keeps the label in place (invisible) so the width never changes.
 * Only one primary button per view.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading = false, loadingLabel = "Working", icon, className, children, disabled, type = "button", forceState, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], forceState && forced[variant][forceState], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className={cn("inline-flex items-center gap-2", loading && "invisible")}>
        {icon}
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" role="status">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          <span className="sr-only">{loadingLabel}</span>
        </span>
      )}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonProps, "children" | "icon"> {
  label: string;
  icon: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, icon, className, variant = "ghost", ...rest }, ref) {
  return (
    <Button ref={ref} variant={variant} aria-label={label} title={label} className={cn("min-w-touch px-0", className)} {...rest}>
      <span aria-hidden className="inline-flex">
        {icon}
      </span>
    </Button>
  );
});
