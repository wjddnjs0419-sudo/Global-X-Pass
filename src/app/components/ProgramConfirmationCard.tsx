import type { ReactNode } from "react";
import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";
import { Button, type ButtonProps } from "./ui/button";

type ProgramConfirmationAction = {
  label: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: ButtonProps["variant"];
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
};

interface ProgramConfirmationCardProps {
  title: string;
  description: ReactNode;
  actions?: ProgramConfirmationAction[];
  padding?: string;
  actionMaxWidth?: string;
}

export function ProgramConfirmationCard({
  title,
  description,
  actions = [],
  padding = "var(--space-event-application-centered-y, 32px) 0",
  actionMaxWidth = "320px",
}: ProgramConfirmationCardProps) {
  const renderAction = (action: ProgramConfirmationAction) => {
    const label = action.loading ? action.loadingLabel ?? action.label : action.label;
    const content = (
      <>
        {action.icon}
        {label}
      </>
    );
    const commonProps = {
      variant: action.variant ?? "outline",
      disabled: action.disabled || action.loading,
      style: { width: "100%" },
    } satisfies Pick<ButtonProps, "variant" | "disabled" | "style">;

    if (action.to && !commonProps.disabled) {
      return (
        <Button key={action.label} asChild {...commonProps}>
          <Link to={action.to}>{content}</Link>
        </Button>
      );
    }

    if (action.href && !commonProps.disabled) {
      return (
        <Button key={action.label} asChild {...commonProps}>
          <a href={action.href}>{content}</a>
        </Button>
      );
    }

    return (
      <Button key={action.label} type="button" onClick={action.onClick} {...commonProps}>
        {content}
      </Button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "var(--space-event-application-centered-gap, 14px)", padding }}>
      <CheckCircle2 size="var(--size-event-application-action-lg, 52px)" color="var(--color-accent-green)" />
      <h3 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: "var(--text-event-application-heading, 24px)", fontWeight: "var(--weight-black, 900)" }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: "var(--leading-event-application-message, 1.7)" }}>
        {description}
      </p>
      {actions.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-event-application-compact-inline, 10px)", width: "100%", maxWidth: actionMaxWidth }}>
          {actions.map(renderAction)}
        </div>
      )}
    </div>
  );
}
