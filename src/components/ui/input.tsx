import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * HALO-styled text input for the auth surface (auth spec §16, §18).
 *
 * Lives in `src/components/ui` so it wins the `@/*` path resolution over the
 * older neutral-token shadcn input at the repo root — the auth pages get HALO
 * tokens with no import churn. Flat (HALO Rule 2: no shadow), ≥44px touch
 * target (§12), amber focus (border.focus + brand ring), danger state driven by
 * `aria-invalid` so field errors can wire it without extra props (§10, §13).
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-md border border-border-default bg-surface-canvas px-4 text-[14px] leading-[20px] text-ink transition-colors outline-none",
        "placeholder:text-ink-muted",
        "focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-brand/40",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/25",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
